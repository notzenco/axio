use axio_protocol::{AgentStatus, RepositoryChange, RepositorySnapshot, ReviewStatus, TaskStatus};

use crate::{CoreError, Workspace};

#[test]
fn running_agent_can_wait_and_resume() {
    let mut workspace = Workspace::demo();

    workspace
        .transition_agent("codex-01", AgentStatus::Waiting)
        .expect("running to waiting should be valid");
    workspace
        .transition_agent("codex-01", AgentStatus::Running)
        .expect("waiting to running should be valid");

    assert_eq!(workspace.snapshot().agents[0].status, AgentStatus::Running);
}

#[test]
fn running_agent_cannot_jump_back_to_idle() {
    let mut workspace = Workspace::demo();

    let error = workspace
        .transition_agent("codex-01", AgentStatus::Idle)
        .expect_err("running to idle must be rejected");

    assert!(matches!(error, CoreError::InvalidTransition { .. }));
}

#[test]
fn unknown_agent_is_rejected() {
    let mut workspace = Workspace::demo();

    assert_eq!(
        workspace.transition_agent("missing", AgentStatus::Starting),
        Err(CoreError::AgentNotFound("missing".to_owned()))
    );
}

#[test]
fn task_creation_selects_a_reviewable_boundary() {
    let mut workspace = Workspace::demo();

    workspace
        .create_task("Polish native window controls".to_owned())
        .expect("valid task should be created");

    let snapshot = workspace.snapshot();
    assert_eq!(snapshot.selected_task, "task-3");
    assert_eq!(
        snapshot.tasks[2].worktree,
        "axio/polish-native-window-controls"
    );
}

#[test]
fn repository_metadata_enriches_the_selected_task() {
    let mut workspace = Workspace::demo();

    workspace.attach_repository(RepositorySnapshot {
        root: "C:/work/axio".to_owned(),
        name: "axio".to_owned(),
        branch: "feature/live-repository".to_owned(),
        files: vec!["Cargo.toml".to_owned()],
        files_truncated: false,
        changes: vec![RepositoryChange {
            path: "Cargo.toml".to_owned(),
            status: "M".to_owned(),
            additions: Some(1),
            deletions: Some(0),
        }],
    });

    let snapshot = workspace.snapshot();
    assert_eq!(snapshot.project, "axio");
    assert_eq!(snapshot.branch, "feature/live-repository");
    assert_eq!(snapshot.tasks[0].changed_files, 1);
    assert_eq!(
        snapshot
            .repository
            .expect("repository should be attached")
            .files
            .len(),
        1
    );
}

#[test]
fn direction_and_review_are_recorded_in_the_task_narrative() {
    let mut workspace = Workspace::demo();

    workspace
        .send_direction(
            "desktop",
            "Use the real Tauri window".to_owned(),
            "Codex".to_owned(),
        )
        .expect("direction should be accepted");
    workspace
        .review_task("desktop", true)
        .expect("pending review should be decidable");

    let snapshot = workspace.snapshot();
    assert_eq!(snapshot.tasks[0].status, TaskStatus::Completed);
    assert_eq!(snapshot.tasks[0].review, ReviewStatus::Approved);
    assert_eq!(snapshot.activity.len(), 6);
    assert_eq!(
        snapshot.activity[4].detail.as_deref(),
        Some("Direction sent to Codex")
    );
}
