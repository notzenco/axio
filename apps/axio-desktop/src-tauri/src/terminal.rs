use std::{
    collections::{BTreeMap, VecDeque},
    io::{Read, Write},
    path::Path,
    sync::{
        Arc, Mutex,
        atomic::{AtomicU64, Ordering},
    },
    thread,
    time::Duration,
};

use axio_protocol::{
    TerminalExitEvent, TerminalOutputEvent, TerminalOutputSnapshot, TerminalProvider,
    TerminalSessionSnapshot, TerminalSessionStatus,
};
use portable_pty::{ChildKiller, CommandBuilder, MasterPty, PtySize, native_pty_system};
use tauri::{AppHandle, Emitter};
#[cfg(windows)]
use win32job::{ExtendedLimitInfo, Job};

const DEFAULT_ROWS: u16 = 24;
const DEFAULT_COLUMNS: u16 = 80;
const MAX_INPUT_BYTES: usize = 64 * 1024;
const MAX_OUTPUT_BYTES: usize = 512 * 1024;
const OUTPUT_EVENT_INTERVAL: Duration = Duration::from_millis(12);
const MAX_TERMINAL_DIMENSION: u16 = 1000;
const MAX_SESSIONS: usize = 12;
const MAX_SPAWN_COUNT: u8 = 8;
const OUTPUT_EVENT: &str = "terminal-output";
const EXIT_EVENT: &str = "terminal-exit";

struct TerminalSession {
    snapshot: TerminalSessionSnapshot,
    master: Box<dyn MasterPty + Send>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    killer: Box<dyn ChildKiller + Send + Sync>,
    output: Arc<Mutex<OutputBuffer>>,
}

#[derive(Default)]
struct OutputBuffer {
    bytes: VecDeque<u8>,
    start_offset: u64,
    end_offset: u64,
}

impl OutputBuffer {
    fn append(&mut self, data: &[u8]) -> u64 {
        let offset = self.end_offset;
        self.bytes.extend(data);
        self.end_offset = self.end_offset.saturating_add(data.len() as u64);
        let overflow = self.bytes.len().saturating_sub(MAX_OUTPUT_BYTES);
        self.bytes.drain(..overflow);
        self.start_offset = self.start_offset.saturating_add(overflow as u64);
        offset
    }

    fn snapshot(&self) -> TerminalOutputSnapshot {
        TerminalOutputSnapshot {
            data: self.bytes.iter().copied().collect(),
            start_offset: self.start_offset,
            end_offset: self.end_offset,
        }
    }
}

/// Owns transient PTY processes for the lifetime of the desktop application.
pub struct TerminalManager {
    sessions: Arc<Mutex<BTreeMap<String, TerminalSession>>>,
    next_id: AtomicU64,
    #[cfg(windows)]
    process_job: ProcessJob,
}

impl TerminalManager {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            sessions: Arc::new(Mutex::new(BTreeMap::new())),
            next_id: AtomicU64::new(1),
            #[cfg(windows)]
            process_job: ProcessJob::new()?,
        })
    }

    pub fn spawn(
        &self,
        app: &AppHandle,
        provider: TerminalProvider,
        count: u8,
        task_id: &str,
        repository_root: &str,
    ) -> Result<Vec<TerminalSessionSnapshot>, String> {
        let current_count = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?
            .values()
            .filter(|session| session.snapshot.status == TerminalSessionStatus::Running)
            .count();
        validate_spawn_count(count, current_count)?;
        if !Path::new(repository_root).is_dir() {
            return Err("the terminal working directory is unavailable".to_owned());
        }

        let mut spawned = Vec::with_capacity(usize::from(count));
        for _ in 0..count {
            match self.spawn_one(app, provider, task_id, repository_root) {
                Ok(snapshot) => spawned.push(snapshot),
                Err(error) => {
                    for snapshot in &spawned {
                        let _ = self.stop(&snapshot.id);
                        let _ = self.remove(&snapshot.id, true);
                    }
                    return Err(error);
                }
            }
        }
        Ok(spawned)
    }

    pub fn snapshots(
        &self,
        repository_root: &str,
        task_id: &str,
    ) -> Result<Vec<TerminalSessionSnapshot>, String> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
        Ok(sessions
            .values()
            .filter(|session| {
                session.snapshot.repository_root == repository_root
                    && session.snapshot.task_id == task_id
            })
            .map(|session| session.snapshot.clone())
            .collect())
    }

    pub fn output(&self, session_id: &str) -> Result<TerminalOutputSnapshot, String> {
        let output = {
            let sessions = self
                .sessions
                .lock()
                .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
            sessions
                .get(session_id)
                .map(|session| Arc::clone(&session.output))
                .ok_or_else(|| "terminal session was not found".to_owned())?
        };
        let snapshot = output
            .lock()
            .map_err(|error| format!("terminal output is unavailable: {error}"))?
            .snapshot();
        Ok(snapshot)
    }

    pub fn write(&self, session_id: &str, data: &[u8]) -> Result<(), String> {
        if data.len() > MAX_INPUT_BYTES {
            return Err(format!(
                "terminal input is limited to {MAX_INPUT_BYTES} bytes per write"
            ));
        }
        let writer = {
            let sessions = self
                .sessions
                .lock()
                .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
            let session = sessions
                .get(session_id)
                .ok_or_else(|| "terminal session was not found".to_owned())?;
            if session.snapshot.status != TerminalSessionStatus::Running {
                return Err("terminal session is not running".to_owned());
            }
            Arc::clone(&session.writer)
        };
        let mut writer = writer
            .lock()
            .map_err(|error| format!("terminal input is unavailable: {error}"))?;
        writer
            .write_all(data)
            .and_then(|()| writer.flush())
            .map_err(|error| format!("terminal input failed: {error}"))
    }

    pub fn resize(&self, session_id: &str, rows: u16, columns: u16) -> Result<(), String> {
        if rows == 0
            || columns == 0
            || rows > MAX_TERMINAL_DIMENSION
            || columns > MAX_TERMINAL_DIMENSION
        {
            return Err(format!(
                "terminal dimensions must be between 1 and {MAX_TERMINAL_DIMENSION}"
            ));
        }
        let sessions = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| "terminal session was not found".to_owned())?;
        session
            .master
            .resize(PtySize {
                rows,
                cols: columns,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|error| format!("terminal resize failed: {error}"))
    }

    pub fn stop(&self, session_id: &str) -> Result<TerminalSessionSnapshot, String> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
        let session = sessions
            .get_mut(session_id)
            .ok_or_else(|| "terminal session was not found".to_owned())?;
        if session.snapshot.status == TerminalSessionStatus::Running {
            session.snapshot.status = TerminalSessionStatus::Stopping;
            session
                .killer
                .kill()
                .map_err(|error| format!("terminal stop failed: {error}"))?;
        }
        Ok(session.snapshot.clone())
    }

    pub fn close(&self, session_id: &str) -> Result<(), String> {
        self.remove(session_id, false)
    }

    pub fn stop_for_repository(&self, repository_root: &str) {
        let session_ids = self
            .sessions
            .lock()
            .map(|sessions| {
                sessions
                    .values()
                    .filter(|session| {
                        session.snapshot.repository_root == repository_root
                            && session.snapshot.status == TerminalSessionStatus::Running
                    })
                    .map(|session| session.snapshot.id.clone())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        for session_id in session_ids {
            let _ = self.stop(&session_id);
        }
    }

    pub fn stop_all(&self) {
        let session_ids = self
            .sessions
            .lock()
            .map(|sessions| sessions.keys().cloned().collect::<Vec<_>>())
            .unwrap_or_default();
        for session_id in session_ids {
            let _ = self.stop(&session_id);
        }
    }

    fn spawn_one(
        &self,
        app: &AppHandle,
        provider: TerminalProvider,
        task_id: &str,
        repository_root: &str,
    ) -> Result<TerminalSessionSnapshot, String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: DEFAULT_ROWS,
                cols: DEFAULT_COLUMNS,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|error| format!("terminal PTY could not be created: {error}"))?;
        let mut command = provider_command(provider);
        command.cwd(repository_root);
        command.env("TERM", "xterm-256color");
        command.env("COLORTERM", "truecolor");

        let mut child = pair.slave.spawn_command(command).map_err(|error| {
            format!("{} could not be launched: {error}", provider_name(provider))
        })?;
        #[cfg(windows)]
        if let Err(error) = self.process_job.assign(child.as_ref()) {
            let _ = child.kill();
            return Err(error);
        }
        drop(pair.slave);

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|error| format!("terminal output could not be connected: {error}"))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|error| format!("terminal input could not be connected: {error}"))?;
        let writer = Arc::new(Mutex::new(writer));
        let output = Arc::new(Mutex::new(OutputBuffer::default()));
        let killer = child.clone_killer();
        let id_number = self.next_id.fetch_add(1, Ordering::Relaxed);
        let session_id = format!("terminal-{id_number}");
        let ordinal = self.next_provider_ordinal(provider)?;
        let snapshot = TerminalSessionSnapshot {
            id: session_id.clone(),
            provider,
            ordinal,
            status: TerminalSessionStatus::Running,
            task_id: task_id.to_owned(),
            repository_root: repository_root.to_owned(),
            cwd: repository_root.to_owned(),
            pid: child.process_id(),
            exit_code: None,
        };
        self.sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?
            .insert(
                session_id.clone(),
                TerminalSession {
                    snapshot: snapshot.clone(),
                    master: pair.master,
                    writer,
                    killer,
                    output: Arc::clone(&output),
                },
            );

        let output_app = app.clone();
        let output_session_id = session_id.clone();
        if let Err(error) = thread::Builder::new()
            .name(format!("axio-{session_id}-output"))
            .spawn(move || {
                let mut buffer = [0_u8; 8192];
                while let Ok(read) = reader.read(&mut buffer) {
                    if read == 0 {
                        break;
                    }
                    let data = buffer[..read].to_vec();
                    let offset = output
                        .lock()
                        .map(|mut buffer| buffer.append(&data))
                        .unwrap_or_default();
                    let _ = output_app.emit(
                        OUTPUT_EVENT,
                        TerminalOutputEvent {
                            session_id: output_session_id.clone(),
                            offset,
                            data,
                        },
                    );
                    thread::sleep(OUTPUT_EVENT_INTERVAL);
                }
            })
        {
            let _ = self.stop(&session_id);
            let _ = self.remove(&session_id, true);
            return Err(format!("terminal output worker could not start: {error}"));
        }

        let exit_sessions = Arc::clone(&self.sessions);
        let exit_app = app.clone();
        let update_session_id = session_id.clone();
        let wait_session_id = session_id.clone();
        if let Err(error) = thread::Builder::new()
            .name(format!("axio-{session_id}-wait"))
            .spawn(move || {
                let result = child.wait();
                let (status, exit_code) = match result {
                    Ok(exit) => (TerminalSessionStatus::Exited, Some(exit.exit_code())),
                    Err(_) => (TerminalSessionStatus::Failed, None),
                };
                if let Ok(mut sessions) = exit_sessions.lock()
                    && let Some(session) = sessions.get_mut(&update_session_id)
                {
                    session.snapshot.status = status;
                    session.snapshot.exit_code = exit_code;
                }
                let _ = exit_app.emit(
                    EXIT_EVENT,
                    TerminalExitEvent {
                        session_id: wait_session_id,
                        status,
                        exit_code,
                    },
                );
            })
        {
            let _ = self.stop(&session_id);
            let _ = self.remove(&session_id, true);
            return Err(format!("terminal exit worker could not start: {error}"));
        }

        Ok(snapshot)
    }

    fn next_provider_ordinal(&self, provider: TerminalProvider) -> Result<u32, String> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
        Ok(sessions
            .values()
            .filter(|session| session.snapshot.provider == provider)
            .map(|session| session.snapshot.ordinal)
            .max()
            .unwrap_or(0)
            + 1)
    }

    fn remove(&self, session_id: &str, force: bool) -> Result<(), String> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|error| format!("terminal sessions are unavailable: {error}"))?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| "terminal session was not found".to_owned())?;
        if !force
            && matches!(
                session.snapshot.status,
                TerminalSessionStatus::Running | TerminalSessionStatus::Stopping
            )
        {
            return Err("stop the terminal session before closing its pane".to_owned());
        }
        sessions.remove(session_id);
        Ok(())
    }
}

#[cfg(windows)]
struct ProcessJob {
    job: Job,
}

#[cfg(windows)]
impl ProcessJob {
    fn new() -> Result<Self, String> {
        let mut limits = ExtendedLimitInfo::new();
        limits.limit_kill_on_job_close();
        Job::create_with_limit_info(&limits)
            .map(|job| Self { job })
            .map_err(|error| format!("terminal process cleanup could not be configured: {error}"))
    }

    fn assign(&self, child: &(dyn portable_pty::Child + Send + Sync)) -> Result<(), String> {
        let process_handle = child
            .as_raw_handle()
            .ok_or_else(|| "terminal process handle is unavailable".to_owned())?;
        self.job
            .assign_process(process_handle as isize)
            .map_err(|error| format!("terminal process cleanup could not be attached: {error}"))
    }
}

impl Drop for TerminalManager {
    fn drop(&mut self) {
        self.stop_all();
    }
}

fn validate_spawn_count(count: u8, current_count: usize) -> Result<(), String> {
    if count == 0 || count > MAX_SPAWN_COUNT {
        return Err(format!(
            "choose between 1 and {MAX_SPAWN_COUNT} terminal instances"
        ));
    }
    if current_count + usize::from(count) > MAX_SESSIONS {
        return Err(format!(
            "Axio supports at most {MAX_SESSIONS} concurrent terminal sessions"
        ));
    }
    Ok(())
}

fn provider_command(provider: TerminalProvider) -> CommandBuilder {
    match provider {
        TerminalProvider::Shell => CommandBuilder::new_default_prog(),
        TerminalProvider::Codex => CommandBuilder::new("codex"),
        TerminalProvider::ClaudeCode => CommandBuilder::new("claude"),
        TerminalProvider::OpenCode => CommandBuilder::new("opencode"),
    }
}

fn provider_name(provider: TerminalProvider) -> &'static str {
    match provider {
        TerminalProvider::Shell => "Shell",
        TerminalProvider::Codex => "Codex",
        TerminalProvider::ClaudeCode => "Claude Code",
        TerminalProvider::OpenCode => "OpenCode",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn output_buffer_retains_only_the_latest_bounded_bytes() {
        let mut buffer = OutputBuffer::default();
        buffer.append(&vec![1; MAX_OUTPUT_BYTES]);
        buffer.append(&[2, 3, 4]);

        let contents = buffer.snapshot();
        assert_eq!(contents.data.len(), MAX_OUTPUT_BYTES);
        assert_eq!(&contents.data[contents.data.len() - 3..], &[2, 3, 4]);
        assert_eq!(contents.start_offset, 3);
        assert_eq!(contents.end_offset, (MAX_OUTPUT_BYTES + 3) as u64);
    }

    #[test]
    fn spawn_limits_reject_zero_large_batches_and_total_overflow() {
        assert!(validate_spawn_count(0, 0).is_err());
        assert!(validate_spawn_count(MAX_SPAWN_COUNT + 1, 0).is_err());
        assert!(validate_spawn_count(3, MAX_SESSIONS - 2).is_err());
        assert!(validate_spawn_count(2, MAX_SESSIONS - 2).is_ok());
    }
}
