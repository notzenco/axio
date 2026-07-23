use std::{path::PathBuf, sync::Mutex};

use axio_core::{
    Workspace, WorkspaceCatalog, WorkspaceStore, open_repository, read_repository_file as read_file,
};
use axio_protocol::{
    AgentStatus, RepositoryFileContent, WorkspaceLifecycleSnapshot, WorkspaceSnapshot,
};
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;

struct AppState {
    runtime: Mutex<WorkspaceRuntime>,
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
    let mut runtime = lock_runtime(&state)?;
    let mut catalog = runtime.catalog.clone();
    catalog.open(&repository);
    runtime.commit_catalog(catalog)?;
    if runtime.workspace.snapshot().tasks.is_empty() {
        runtime.workspace = Workspace::demo();
    }
    runtime.workspace.attach_repository(repository.clone());
    runtime.restore_selected_task(&repository.root);
    Ok(runtime.lifecycle_snapshot())
}

#[tauri::command]
fn close_workspace(state: State<'_, AppState>) -> Result<WorkspaceLifecycleSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let mut catalog = runtime.catalog.clone();
    catalog.close();
    runtime.commit_catalog(catalog)?;
    runtime.workspace.close_repository();
    Ok(runtime.lifecycle_snapshot())
}

#[tauri::command]
fn remove_recent_workspace(
    path: String,
    state: State<'_, AppState>,
) -> Result<WorkspaceLifecycleSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let was_active = runtime.catalog.active_workspace.as_deref() == Some(path.as_str());
    let mut catalog = runtime.catalog.clone();
    catalog.remove_recent(&path);
    runtime.commit_catalog(catalog)?;
    if was_active {
        runtime.workspace.close_repository();
    }
    Ok(runtime.lifecycle_snapshot())
}

#[tauri::command]
fn refresh_repository(state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let path = runtime
        .catalog
        .active_workspace
        .clone()
        .ok_or_else(|| "no active workspace is available".to_owned())?;
    let repository = open_repository(path).map_err(|error| error.to_string())?;
    runtime.workspace.attach_repository(repository);
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
    let mut runtime = lock_runtime(&state)?;
    runtime
        .workspace
        .transition_agent(&id, next)
        .map_err(|error| error.to_string())?;
    Ok(runtime.workspace.snapshot())
}

#[tauri::command]
fn select_task(id: String, state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    let mut workspace = runtime.workspace.clone();
    workspace
        .select_task(&id)
        .map_err(|error| error.to_string())?;
    let mut catalog = runtime.catalog.clone();
    catalog.select_task(&id);
    runtime.commit_catalog(catalog)?;
    runtime.workspace = workspace;
    Ok(runtime.workspace.snapshot())
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

fn mutate_workspace(
    state: State<'_, AppState>,
    operation: impl FnOnce(&mut Workspace) -> Result<(), axio_core::CoreError>,
) -> Result<WorkspaceSnapshot, String> {
    let mut runtime = lock_runtime(&state)?;
    operation(&mut runtime.workspace).map_err(|error| error.to_string())?;
    Ok(runtime.workspace.snapshot())
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
            window_action
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Axio");
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

    fn restore_selected_task(&mut self, path: &str) {
        let Some(task_id) = self.catalog.selected_task(path).map(str::to_owned) else {
            return;
        };
        let _ = self.workspace.select_task(&task_id);
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
}

fn initialize_runtime(state_directory: PathBuf) -> WorkspaceRuntime {
    let store = WorkspaceStore::new(state_directory);
    let (mut catalog, mut warning) = match store.load() {
        Ok(catalog) => (catalog, None),
        Err(error) => (WorkspaceCatalog::default(), Some(error.to_string())),
    };
    let mut workspace = Workspace::empty();
    if let Some(path) = catalog.active_workspace.clone() {
        match open_repository(&path) {
            Ok(repository) => {
                workspace = Workspace::demo();
                workspace.attach_repository(repository);
                if let Some(task_id) = catalog.selected_task(&path) {
                    let _ = workspace.select_task(task_id);
                }
            }
            Err(error) => {
                warning = Some(format!(
                    "The previous workspace could not be restored: {error}"
                ));
                catalog.close();
                if let Err(error) = store.save(&catalog) {
                    warning = Some(error.to_string());
                }
            }
        }
    }
    WorkspaceRuntime {
        workspace,
        catalog,
        store,
        persistence_warning: warning,
    }
}
