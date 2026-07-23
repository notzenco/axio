mod terminal;

use std::{path::PathBuf, sync::Mutex};

use axio_core::{
    Workspace, WorkspaceCatalog, WorkspaceStore, open_repository, read_repository_file as read_file,
};
use axio_protocol::{
    AgentStatus, RepositoryFileContent, RepositorySnapshot, TerminalOutputSnapshot,
    TerminalProvider, TerminalSessionSnapshot, WorkspaceLifecycleSnapshot, WorkspaceSnapshot,
};
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;
use terminal::TerminalManager;

struct AppState {
    runtime: Mutex<WorkspaceRuntime>,
    terminals: TerminalManager,
}

struct WorkspaceRuntime {
    workspace: Workspace,
    catalog: WorkspaceCatalog,
    store: WorkspaceStore,
    persistence_warning: Option<String>,
}

#[tauri::command]
fn workspace_snapshot(state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    state
        .runtime
        .lock()
        .map(|runtime| runtime.workspace.snapshot())
        .map_err(|error| format!("workspace state is unavailable: {error}"))
}

#[tauri::command]
fn workspace_lifecycle(state: State<'_, AppState>) -> Result<WorkspaceLifecycleSnapshot, String> {
    state
        .runtime
        .lock()
        .map(|runtime| runtime.lifecycle_snapshot())
        .map_err(|error| format!("workspace state is unavailable: {error}"))
}

#[tauri::command]
async fn pick_workspace_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    app.dialog()
        .file()
        .set_title("Open Axio workspace")
        .blocking_pick_folder()
        .map(|path| {
            path.as_path()
                .map(|path| path.to_string_lossy().into_owned())
                .ok_or_else(|| "selected folder is not a local filesystem path".to_owned())
        })
        .transpose()
}

#[tauri::command]
fn open_workspace(
    path: String,
    state: State<'_, AppState>,
) -> Result<WorkspaceLifecycleSnapshot, String> {
    let repository = open_repository(&path).map_err(|error| error.to_string())?;
    let repository_root = repository.root.clone();
    let mut runtime = lock_runtime(&state)?;
    let previous_root = runtime
        .workspace
        .snapshot()
        .repository
        .map(|repository| repository.root);
    let mut catalog = runtime.catalog.clone();
    catalog.capture(&runtime.workspace.snapshot());
    catalog.open(&repository);
    let workspace = workspace_for_repository(&catalog, repository);
    catalog.capture(&workspace.snapshot());
    runtime.commit_catalog(catalog)?;
    runtime.workspace = workspace;
    let snapshot = runtime.lifecycle_snapshot();
    drop(runtime);
    if let Some(previous_root) = previous_root
        && previous_root != repository_root
    {
        state.terminals.stop_for_repository(&previous_root);
    }
    Ok(snapshot)
}

#[tauri::command]
fn close_workspace(state: State<'_, AppState>) -> Result<WorkspaceLifecycleSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let previous_root = runtime
        .workspace
        .snapshot()
        .repository
        .map(|repository| repository.root);
    let mut catalog = runtime.catalog.clone();
    catalog.capture(&runtime.workspace.snapshot());
    catalog.close();
    runtime.commit_catalog(catalog)?;
    runtime.workspace = Workspace::empty();
    let snapshot = runtime.lifecycle_snapshot();
    drop(runtime);
    if let Some(previous_root) = previous_root {
        state.terminals.stop_for_repository(&previous_root);
    }
    Ok(snapshot)
}

#[tauri::command]
fn remove_recent_workspace(
    path: String,
    state: State<'_, AppState>,
) -> Result<WorkspaceLifecycleSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let was_active = runtime.catalog.active_workspace.as_deref() == Some(path.as_str());
    let mut catalog = runtime.catalog.clone();
    catalog.capture(&runtime.workspace.snapshot());
    catalog.remove_recent(&path);
    runtime.commit_catalog(catalog)?;
    if was_active {
        runtime.workspace = Workspace::empty();
    }
    let snapshot = runtime.lifecycle_snapshot();
    drop(runtime);
    if was_active {
        state.terminals.stop_for_repository(&path);
    }
    Ok(snapshot)
}

#[tauri::command]
async fn refresh_repository(state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    let path = lock_runtime(&state)?
        .catalog
        .active_workspace
        .clone()
        .ok_or_else(|| "no active workspace is available".to_owned())?;
    let refresh_path = path.clone();
    let repository = tauri::async_runtime::spawn_blocking(move || open_repository(refresh_path))
        .await
        .map_err(|error| format!("repository refresh did not complete: {error}"))?
        .map_err(|error| error.to_string())?;
    let mut runtime = lock_runtime(&state)?;
    if runtime.catalog.active_workspace.as_deref() != Some(path.as_str()) {
        return Ok(runtime.workspace.snapshot());
    }
    let mut workspace = runtime.workspace.clone();
    workspace.attach_repository(repository);
    let mut catalog = runtime.catalog.clone();
    catalog.capture(&workspace.snapshot());
    runtime.commit_catalog(catalog)?;
    runtime.workspace = workspace;
    Ok(runtime.workspace.snapshot())
}

#[tauri::command]
fn read_repository_file(
    path: String,
    state: State<'_, AppState>,
) -> Result<RepositoryFileContent, String> {
    let runtime = lock_runtime(&state)?;
    let snapshot = runtime.workspace.snapshot();
    let repository = snapshot
        .repository
        .as_ref()
        .ok_or_else(|| "no active repository is available".to_owned())?;
    read_file(repository, &path).map_err(|error| error.to_string())
}

#[tauri::command]
fn set_agent_status(
    id: String,
    next: AgentStatus,
    state: State<'_, AppState>,
) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| workspace.transition_agent(&id, next))
}

#[tauri::command]
fn select_task(id: String, state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| workspace.select_task(&id))
}

#[tauri::command]
fn create_task(title: String, state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| workspace.create_task(title))
}

#[tauri::command]
fn send_direction(
    task_id: String,
    message: String,
    audience: String,
    state: State<'_, AppState>,
) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| {
        workspace.send_direction(&task_id, message, audience)
    })
}

#[tauri::command]
fn review_task(
    task_id: String,
    approved: bool,
    state: State<'_, AppState>,
) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| workspace.review_task(&task_id, approved))
}

#[tauri::command]
fn terminal_sessions(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TerminalSessionSnapshot>, String> {
    let repository_root = active_repository_root(&state)?;
    state.terminals.snapshots(&repository_root, &task_id)
}

#[tauri::command]
fn spawn_terminal_instances(
    provider: TerminalProvider,
    count: u8,
    task_id: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<TerminalSessionSnapshot>, String> {
    let repository_root = {
        let runtime = lock_runtime(&state)?;
        let snapshot = runtime.workspace.snapshot();
        if !snapshot.tasks.iter().any(|task| task.id == task_id) {
            return Err("the selected task is unavailable".to_owned());
        }
        snapshot
            .repository
            .map(|repository| repository.root)
            .ok_or_else(|| "no active repository is available".to_owned())?
    };
    state
        .terminals
        .spawn(&app, provider, count, &task_id, &repository_root)
}

#[tauri::command]
fn terminal_output(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<TerminalOutputSnapshot, String> {
    state.terminals.output(&session_id)
}

#[tauri::command]
fn write_terminal_input(
    session_id: String,
    data: Vec<u8>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.terminals.write(&session_id, &data)
}

#[tauri::command]
fn resize_terminal(
    session_id: String,
    rows: u16,
    columns: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.terminals.resize(&session_id, rows, columns)
}

#[tauri::command]
fn stop_terminal(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<TerminalSessionSnapshot, String> {
    state.terminals.stop(&session_id)
}

#[tauri::command]
fn close_terminal(session_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.terminals.close(&session_id)
}

fn mutate_workspace(
    state: State<'_, AppState>,
    operation: impl FnOnce(&mut Workspace) -> Result<(), axio_core::CoreError>,
) -> Result<WorkspaceSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    runtime.mutate(operation)
}

#[tauri::command]
fn window_action(action: String, window: tauri::WebviewWindow) -> Result<(), String> {
    let result = match action.as_str() {
        "drag" => window.start_dragging(),
        "minimize" => window.minimize(),
        "maximize" => {
            let maximized = window.is_maximized().map_err(|error| error.to_string())?;
            if maximized {
                window.unmaximize()
            } else {
                window.maximize()
            }
        }
        "close" => window.close(),
        _ => return Err(format!("unknown window action: {action}")),
    };
    result.map_err(|error| error.to_string())
}

/// Starts the native desktop application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let state_directory = app
                .path()
                .app_config_dir()
                .map_err(|error| format!("Axio's config directory is unavailable: {error}"))?
                .join("workspace-state");
            app.manage(AppState {
                runtime: Mutex::new(initialize_runtime(state_directory)),
                terminals: TerminalManager::new()?,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            workspace_snapshot,
            workspace_lifecycle,
            pick_workspace_folder,
            open_workspace,
            close_workspace,
            remove_recent_workspace,
            refresh_repository,
            read_repository_file,
            set_agent_status,
            select_task,
            create_task,
            send_direction,
            review_task,
            terminal_sessions,
            spawn_terminal_instances,
            terminal_output,
            write_terminal_input,
            resize_terminal,
            stop_terminal,
            close_terminal,
            window_action
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Axio")
        .run(|app, event| {
            if matches!(
                event,
                tauri::RunEvent::Ready
                    | tauri::RunEvent::Resumed
                    | tauri::RunEvent::MainEventsCleared
            ) && app.webview_windows().is_empty()
            {
                app.exit(0);
                return;
            }
            if let tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } = event
                && label == "main"
            {
                api.prevent_close();
                app.exit(0);
            }
        });
}

fn active_repository_root(state: &State<'_, AppState>) -> Result<String, String> {
    lock_runtime(state)?
        .workspace
        .snapshot()
        .repository
        .map(|repository| repository.root)
        .ok_or_else(|| "no active repository is available".to_owned())
}

fn lock_runtime<'a>(
    state: &'a State<'_, AppState>,
) -> Result<std::sync::MutexGuard<'a, WorkspaceRuntime>, String> {
    state
        .runtime
        .lock()
        .map_err(|error| format!("workspace state is unavailable: {error}"))
}

impl WorkspaceRuntime {
    fn lifecycle_snapshot(&self) -> WorkspaceLifecycleSnapshot {
        WorkspaceLifecycleSnapshot {
            workspace: self.workspace.snapshot(),
            recent_workspaces: self.catalog.recent_workspaces.clone(),
            persistence_warning: self.persistence_warning.clone(),
        }
    }

    fn commit_catalog(&mut self, catalog: WorkspaceCatalog) -> Result<(), String> {
        self.store.save(&catalog).map_err(|error| {
            self.persistence_warning = Some(error.to_string());
            error.to_string()
        })?;
        self.catalog = catalog;
        self.persistence_warning = None;
        Ok(())
    }

    fn mutate(
        &mut self,
        operation: impl FnOnce(&mut Workspace) -> Result<(), axio_core::CoreError>,
    ) -> Result<WorkspaceSnapshot, String> {
        let mut workspace = self.workspace.clone();
        operation(&mut workspace).map_err(|error| error.to_string())?;
        let mut catalog = self.catalog.clone();
        catalog.capture(&workspace.snapshot());
        self.commit_catalog(catalog)?;
        self.workspace = workspace;
        Ok(self.workspace.snapshot())
    }
}

fn initialize_runtime(state_directory: PathBuf) -> WorkspaceRuntime {
    let store = WorkspaceStore::new(state_directory);
    let (catalog, warning) = match store.load() {
        Ok(catalog) => (catalog, None),
        Err(error) => (WorkspaceCatalog::default(), Some(error.to_string())),
    };
    let mut workspace = Workspace::empty();
    if let Some(path) = catalog.active_workspace.clone() {
        workspace = workspace_for_repository(&catalog, cached_repository(&catalog, &path));
    }
    WorkspaceRuntime {
        workspace,
        catalog,
        store,
        persistence_warning: warning,
    }
}

fn cached_repository(catalog: &WorkspaceCatalog, path: &str) -> RepositorySnapshot {
    let name = catalog
        .recent_workspaces
        .iter()
        .find(|workspace| workspace.path == path)
        .map(|workspace| workspace.name.clone())
        .or_else(|| {
            PathBuf::from(path)
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
        })
        .unwrap_or_else(|| "repository".to_owned());
    RepositorySnapshot {
        root: path.to_owned(),
        name,
        branch: "loading".to_owned(),
        files: Vec::new(),
        files_truncated: false,
        changes: Vec::new(),
    }
}

fn workspace_for_repository(
    catalog: &WorkspaceCatalog,
    repository: axio_protocol::RepositorySnapshot,
) -> Workspace {
    if let Some(session) = catalog.session(&repository.root) {
        return Workspace::restore(session.clone(), repository);
    }
    let path = repository.root.clone();
    let mut workspace = Workspace::for_repository(repository);
    if let Some(task_id) = catalog.selected_task(&path) {
        let _ = workspace.select_task(task_id);
    }
    workspace
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    fn test_directory() -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be available")
            .as_nanos();
        std::env::temp_dir().join(format!("axio-runtime-restart-{unique}"))
    }

    #[test]
    fn complete_workspace_mutations_survive_runtime_restart() {
        let directory = test_directory();
        let repository = open_repository(env!("CARGO_MANIFEST_DIR"))
            .expect("test checkout should be Git-backed");
        let store = WorkspaceStore::new(&directory);
        let workspace = Workspace::for_repository(repository.clone());
        let mut catalog = WorkspaceCatalog::default();
        catalog.open(&repository);
        catalog.capture(&workspace.snapshot());
        store.save(&catalog).expect("initial state should save");
        let mut runtime = WorkspaceRuntime {
            workspace,
            catalog,
            store,
            persistence_warning: None,
        };

        runtime
            .mutate(|workspace| workspace.create_task("Durable task".to_owned()))
            .expect("task creation should persist");
        runtime
            .mutate(|workspace| {
                workspace.send_direction(
                    "task-2",
                    "Persist this direction".to_owned(),
                    "Codex".to_owned(),
                )
            })
            .expect("direction should persist");
        runtime
            .mutate(|workspace| workspace.review_task("task-2", true))
            .expect("review should persist");
        drop(runtime);

        let restored = initialize_runtime(directory.clone()).workspace.snapshot();
        assert_eq!(restored.selected_task, "task-2");
        assert_eq!(restored.tasks.len(), 2);
        assert_eq!(
            restored
                .tasks
                .iter()
                .find(|task| task.id == "task-2")
                .expect("created task should restore")
                .review,
            axio_protocol::ReviewStatus::Approved
        );
        assert!(restored.activity.iter().any(|activity| {
            activity.task_id == "task-2" && activity.summary == "Persist this direction"
        }));

        fs::remove_dir_all(directory).expect("test state should be removed");
    }

    #[test]
    fn runtime_restores_cached_workspace_without_inspecting_git() {
        let directory = test_directory();
        let missing_root = directory.join("repository-that-is-not-on-disk");
        let repository = RepositorySnapshot {
            root: missing_root.to_string_lossy().into_owned(),
            name: "cached-project".to_owned(),
            branch: "main".to_owned(),
            files: vec!["src/main.rs".to_owned()],
            files_truncated: false,
            changes: Vec::new(),
        };
        let mut workspace = Workspace::demo();
        workspace.attach_repository(repository.clone());
        let mut catalog = WorkspaceCatalog::default();
        catalog.open(&repository);
        catalog.capture(&workspace.snapshot());
        WorkspaceStore::new(&directory)
            .save(&catalog)
            .expect("cached workspace should save");

        let runtime = initialize_runtime(directory.clone());
        let restored = runtime.workspace.snapshot();

        assert_eq!(
            restored
                .repository
                .as_ref()
                .expect("cached repository should restore")
                .root,
            repository.root
        );
        assert_eq!(restored.project, "cached-project");
        assert_eq!(restored.branch, "loading");
        assert_eq!(
            runtime.catalog.active_workspace.as_deref(),
            Some(repository.root.as_str())
        );

        fs::remove_dir_all(directory).expect("test state should be removed");
    }
}
