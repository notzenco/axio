use std::sync::Mutex;

use axio_core::{Workspace, discover_repository, read_repository_file as read_file};
use axio_protocol::{AgentStatus, RepositoryFileContent, WorkspaceSnapshot};
use tauri::State;

struct AppState {
    workspace: Mutex<Workspace>,
}

#[tauri::command]
fn workspace_snapshot(state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    state
        .workspace
        .lock()
        .map(|workspace| workspace.snapshot())
        .map_err(|error| format!("workspace state is unavailable: {error}"))
}

#[tauri::command]
fn refresh_repository(state: State<'_, AppState>) -> Result<WorkspaceSnapshot, String> {
    let repository = discover_repository().map_err(|error| error.to_string())?;
    let mut workspace = state
        .workspace
        .lock()
        .map_err(|error| format!("workspace state is unavailable: {error}"))?;
    workspace.attach_repository(repository);
    Ok(workspace.snapshot())
}

#[tauri::command]
fn read_repository_file(
    path: String,
    state: State<'_, AppState>,
) -> Result<RepositoryFileContent, String> {
    let workspace = state
        .workspace
        .lock()
        .map_err(|error| format!("workspace state is unavailable: {error}"))?;
    let snapshot = workspace.snapshot();
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
    let mut workspace = state
        .workspace
        .lock()
        .map_err(|error| format!("workspace state is unavailable: {error}"))?;
    workspace
        .transition_agent(&id, next)
        .map_err(|error| error.to_string())?;
    Ok(workspace.snapshot())
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

fn mutate_workspace(
    state: State<'_, AppState>,
    operation: impl FnOnce(&mut Workspace) -> Result<(), axio_core::CoreError>,
) -> Result<WorkspaceSnapshot, String> {
    let mut workspace = state
        .workspace
        .lock()
        .map_err(|error| format!("workspace state is unavailable: {error}"))?;
    operation(&mut workspace).map_err(|error| error.to_string())?;
    Ok(workspace.snapshot())
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
    let mut workspace = Workspace::demo();
    if let Ok(repository) = discover_repository() {
        workspace.attach_repository(repository);
    }
    tauri::Builder::default()
        .manage(AppState {
            workspace: Mutex::new(workspace),
        })
        .invoke_handler(tauri::generate_handler![
            workspace_snapshot,
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
