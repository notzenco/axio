use std::sync::Mutex;

use axio_core::Workspace;
use axio_protocol::{AgentStatus, WorkspaceSnapshot};
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
    state: State<'_, AppState>,
) -> Result<WorkspaceSnapshot, String> {
    mutate_workspace(state, |workspace| {
        workspace.send_direction(&task_id, message)
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
    tauri::Builder::default()
        .manage(AppState {
            workspace: Mutex::new(Workspace::demo()),
        })
        .invoke_handler(tauri::generate_handler![
            workspace_snapshot,
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
