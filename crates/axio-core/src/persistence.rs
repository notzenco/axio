use std::{
    collections::BTreeMap,
    error::Error,
    fmt, fs,
    io::Write,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use axio_protocol::{RecentWorkspace, RepositorySnapshot, WorkspaceSession, WorkspaceSnapshot};
use serde::{Deserialize, Serialize};

const SCHEMA_VERSION: u32 = 2;
const FIRST_SUPPORTED_SCHEMA_VERSION: u32 = 1;
const MAX_RECENT_WORKSPACES: usize = 12;

/// Durable local workspace identity and recents.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct WorkspaceCatalog {
    pub active_workspace: Option<String>,
    pub recent_workspaces: Vec<RecentWorkspace>,
    pub selected_tasks: BTreeMap<String, String>,
    pub workspace_sessions: BTreeMap<String, WorkspaceSession>,
}

impl WorkspaceCatalog {
    /// Records an explicitly opened repository as active and most recent.
    pub fn open(&mut self, repository: &RepositorySnapshot) {
        self.active_workspace = Some(repository.root.clone());
        self.recent_workspaces
            .retain(|workspace| workspace.path != repository.root);
        self.recent_workspaces.insert(
            0,
            RecentWorkspace {
                path: repository.root.clone(),
                name: repository.name.clone(),
                last_opened_unix_ms: now_unix_ms(),
            },
        );
        self.recent_workspaces.truncate(MAX_RECENT_WORKSPACES);
    }

    /// Closes the active workspace while retaining it in recents.
    pub fn close(&mut self) {
        self.active_workspace = None;
    }

    /// Forgets a recent workspace without deleting its source directory.
    pub fn remove_recent(&mut self, path: &str) {
        self.recent_workspaces
            .retain(|workspace| workspace.path != path);
        if self.active_workspace.as_deref() == Some(path) {
            self.active_workspace = None;
        }
        self.selected_tasks.remove(path);
        self.workspace_sessions.remove(path);
    }

    /// Remembers the selected task independently for each repository.
    pub fn select_task(&mut self, task_id: &str) {
        if let Some(path) = &self.active_workspace {
            self.selected_tasks.insert(path.clone(), task_id.to_owned());
        }
    }

    #[must_use]
    pub fn selected_task(&self, path: &str) -> Option<&str> {
        self.selected_tasks.get(path).map(String::as_str)
    }

    /// Captures all repository-scoped task, agent, and activity state.
    pub fn capture(&mut self, snapshot: &WorkspaceSnapshot) {
        let Some(repository) = &snapshot.repository else {
            return;
        };
        self.selected_tasks
            .insert(repository.root.clone(), snapshot.selected_task.clone());
        self.workspace_sessions
            .insert(repository.root.clone(), WorkspaceSession::from(snapshot));
    }

    /// Returns the complete durable state for one repository, when available.
    #[must_use]
    pub fn session(&self, path: &str) -> Option<&WorkspaceSession> {
        self.workspace_sessions.get(path)
    }
}

/// A recoverable two-slot store for workspace identity.
#[derive(Debug, Clone)]
pub struct WorkspaceStore {
    directory: PathBuf,
}

impl WorkspaceStore {
    #[must_use]
    pub fn new(directory: impl Into<PathBuf>) -> Self {
        Self {
            directory: directory.into(),
        }
    }

    /// Loads the newest valid slot, falling back to the other after corruption.
    pub fn load(&self) -> Result<WorkspaceCatalog, PersistenceError> {
        let slots = [self.slot_path("a"), self.slot_path("b")];
        let mut valid = Vec::new();
        let mut found = false;
        for path in slots {
            match fs::read(&path) {
                Ok(bytes) => {
                    found = true;
                    if let Ok(envelope) = serde_json::from_slice::<PersistedCatalog>(&bytes)
                        && (FIRST_SUPPORTED_SCHEMA_VERSION..=SCHEMA_VERSION)
                            .contains(&envelope.schema_version)
                    {
                        valid.push(envelope);
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => return Err(PersistenceError::Io(error)),
            }
        }

        if let Some(envelope) = valid.into_iter().max_by_key(|entry| entry.generation) {
            return Ok(envelope.catalog);
        }
        if found {
            return Err(PersistenceError::Corrupt);
        }
        Ok(WorkspaceCatalog::default())
    }

    /// Writes the next generation without replacing the last valid slot.
    pub fn save(&self, catalog: &WorkspaceCatalog) -> Result<(), PersistenceError> {
        fs::create_dir_all(&self.directory).map_err(PersistenceError::Io)?;
        let current_generation = self.current_generation();
        let generation = current_generation.saturating_add(1);
        let slot = if generation.is_multiple_of(2) {
            "a"
        } else {
            "b"
        };
        let destination = self.slot_path(slot);
        let temporary = self.directory.join(format!("workspace-{slot}.tmp"));
        let bytes = serde_json::to_vec_pretty(&PersistedCatalog {
            schema_version: SCHEMA_VERSION,
            generation,
            catalog: catalog.clone(),
        })
        .map_err(PersistenceError::Serialize)?;

        let mut file = fs::File::create(&temporary).map_err(PersistenceError::Io)?;
        file.write_all(&bytes).map_err(PersistenceError::Io)?;
        file.sync_all().map_err(PersistenceError::Io)?;
        if destination.exists() {
            fs::remove_file(&destination).map_err(PersistenceError::Io)?;
        }
        fs::rename(&temporary, destination).map_err(PersistenceError::Io)
    }

    fn current_generation(&self) -> u64 {
        ["a", "b"]
            .into_iter()
            .filter_map(|slot| fs::read(self.slot_path(slot)).ok())
            .filter_map(|bytes| serde_json::from_slice::<PersistedCatalog>(&bytes).ok())
            .filter(|entry| {
                (FIRST_SUPPORTED_SCHEMA_VERSION..=SCHEMA_VERSION).contains(&entry.schema_version)
            })
            .map(|entry| entry.generation)
            .max()
            .unwrap_or(0)
    }

    fn slot_path(&self, slot: &str) -> PathBuf {
        self.directory.join(format!("workspace-{slot}.json"))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PersistedCatalog {
    schema_version: u32,
    generation: u64,
    catalog: WorkspaceCatalog,
}

impl Serialize for WorkspaceCatalog {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        PersistedCatalogData {
            active_workspace: self.active_workspace.as_deref(),
            recent_workspaces: &self.recent_workspaces,
            selected_tasks: &self.selected_tasks,
            workspace_sessions: &self.workspace_sessions,
        }
        .serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for WorkspaceCatalog {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let data = PersistedCatalogDataOwned::deserialize(deserializer)?;
        Ok(Self {
            active_workspace: data.active_workspace,
            recent_workspaces: data.recent_workspaces,
            selected_tasks: data.selected_tasks,
            workspace_sessions: data.workspace_sessions,
        })
    }
}

#[derive(Serialize)]
struct PersistedCatalogData<'a> {
    active_workspace: Option<&'a str>,
    recent_workspaces: &'a [RecentWorkspace],
    selected_tasks: &'a BTreeMap<String, String>,
    workspace_sessions: &'a BTreeMap<String, WorkspaceSession>,
}

#[derive(Deserialize)]
struct PersistedCatalogDataOwned {
    active_workspace: Option<String>,
    recent_workspaces: Vec<RecentWorkspace>,
    #[serde(default)]
    selected_tasks: BTreeMap<String, String>,
    #[serde(default)]
    workspace_sessions: BTreeMap<String, WorkspaceSession>,
}

/// A local persistence failure that never implies source-repository damage.
#[derive(Debug)]
pub enum PersistenceError {
    Io(std::io::Error),
    Serialize(serde_json::Error),
    Corrupt,
}

impl fmt::Display for PersistenceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "workspace state could not be accessed: {error}"),
            Self::Serialize(error) => {
                write!(
                    formatter,
                    "workspace state could not be serialized: {error}"
                )
            }
            Self::Corrupt => formatter
                .write_str("workspace state is corrupt; source repositories were not changed"),
        }
    }
}

impl Error for PersistenceError {}

fn now_unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| {
            u64::try_from(duration.as_millis()).unwrap_or(u64::MAX)
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Workspace;
    use axio_protocol::AgentStatus;
    use std::path::Path;

    fn test_directory(name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be available")
            .as_nanos();
        std::env::temp_dir().join(format!("axio-{name}-{unique}"))
    }

    fn repository(path: &Path) -> RepositorySnapshot {
        RepositorySnapshot {
            root: path.to_string_lossy().into_owned(),
            name: "A workspace ü".to_owned(),
            branch: "main".to_owned(),
            files: Vec::new(),
            files_truncated: false,
            changes: Vec::new(),
        }
    }

    #[test]
    fn round_trips_paths_with_spaces_and_non_ascii_characters() {
        let directory = test_directory("workspace persistence ü");
        let store = WorkspaceStore::new(&directory);
        let mut catalog = WorkspaceCatalog::default();
        catalog.open(&repository(Path::new("C:/Projects/A workspace ü")));

        store.save(&catalog).expect("catalog should save");
        assert_eq!(store.load().expect("catalog should load"), catalog);

        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn round_trips_complete_repository_sessions_independently() {
        let directory = test_directory("complete-sessions");
        let store = WorkspaceStore::new(&directory);
        let first_repository = repository(Path::new("C:/Projects/first"));
        let second_repository = repository(Path::new("C:/Projects/second"));
        let mut first_workspace = Workspace::demo();
        first_workspace.attach_repository(first_repository.clone());
        first_workspace
            .create_task("Persist the complete session".to_owned())
            .expect("task should be created");
        first_workspace
            .send_direction(
                "task-3",
                "Restore this after restart".to_owned(),
                "All agents".to_owned(),
            )
            .expect("direction should be recorded");
        first_workspace
            .transition_agent("codex-01", AgentStatus::Waiting)
            .expect("agent transition should be recorded");

        let mut second_workspace = Workspace::demo();
        second_workspace.attach_repository(second_repository.clone());
        second_workspace
            .select_task("protocol")
            .expect("second workspace selection should change");

        let mut catalog = WorkspaceCatalog::default();
        catalog.open(&first_repository);
        catalog.capture(&first_workspace.snapshot());
        catalog.open(&second_repository);
        catalog.capture(&second_workspace.snapshot());
        store.save(&catalog).expect("catalog should save");

        let restored = store.load().expect("catalog should load");
        assert_eq!(
            restored.session(&first_repository.root),
            Some(&WorkspaceSession::from(&first_workspace.snapshot()))
        );
        assert_eq!(
            restored.session(&second_repository.root),
            Some(&WorkspaceSession::from(&second_workspace.snapshot()))
        );
        assert_ne!(
            restored
                .session(&first_repository.root)
                .expect("first session should exist")
                .selected_task,
            restored
                .session(&second_repository.root)
                .expect("second session should exist")
                .selected_task
        );

        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn migrates_schema_one_catalogs_and_writes_schema_two() {
        let directory = test_directory("schema-migration");
        let store = WorkspaceStore::new(&directory);
        fs::create_dir_all(&directory).expect("state directory should exist");
        let legacy = serde_json::json!({
            "schema_version": 1,
            "generation": 1,
            "catalog": {
                "active_workspace": "C:/Projects/legacy",
                "recent_workspaces": [],
                "selected_tasks": {
                    "C:/Projects/legacy": "protocol"
                }
            }
        });
        fs::write(
            store.slot_path("b"),
            serde_json::to_vec_pretty(&legacy).expect("legacy catalog should serialize"),
        )
        .expect("legacy catalog should be writable");

        let migrated = store.load().expect("schema one should migrate");
        assert_eq!(
            migrated.selected_task("C:/Projects/legacy"),
            Some("protocol")
        );
        assert!(migrated.workspace_sessions.is_empty());

        store.save(&migrated).expect("migrated catalog should save");
        let saved: serde_json::Value = serde_json::from_slice(
            &fs::read(store.slot_path("a")).expect("schema two slot should exist"),
        )
        .expect("schema two slot should be valid JSON");
        assert_eq!(saved["schema_version"], SCHEMA_VERSION);
        assert!(saved["catalog"]["workspace_sessions"].is_object());

        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn falls_back_to_previous_slot_when_newest_is_corrupt() {
        let directory = test_directory("workspace-recovery");
        let store = WorkspaceStore::new(&directory);
        let mut catalog = WorkspaceCatalog::default();
        catalog.open(&repository(Path::new("C:/Projects/first")));
        store.save(&catalog).expect("first generation should save");
        catalog.open(&repository(Path::new("C:/Projects/second")));
        store.save(&catalog).expect("second generation should save");
        fs::write(store.slot_path("a"), b"{interrupted")
            .expect("newest slot should be corruptible");

        let recovered = store.load().expect("previous slot should remain valid");
        assert_eq!(
            recovered.active_workspace.as_deref(),
            Some("C:/Projects/first")
        );

        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn removing_recent_workspace_never_touches_the_repository() {
        let source = test_directory("source");
        fs::create_dir_all(&source).expect("source directory should exist");
        fs::write(source.join("keep.txt"), "keep").expect("source file should exist");
        let mut catalog = WorkspaceCatalog::default();
        let repository = repository(&source);
        let mut workspace = Workspace::demo();
        workspace.attach_repository(repository.clone());
        catalog.open(&repository);
        catalog.capture(&workspace.snapshot());

        catalog.remove_recent(&source.to_string_lossy());

        assert!(source.join("keep.txt").exists());
        assert!(catalog.session(&source.to_string_lossy()).is_none());
        fs::remove_dir_all(source).expect("test directory should be removed");
    }
}
