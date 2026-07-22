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

/// Starts the native desktop application.
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            workspace: Mutex::new(Workspace::demo()),
        })
        .invoke_handler(tauri::generate_handler![
            workspace_snapshot,
            set_agent_status
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Axio");
}
