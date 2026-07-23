use std::{env, process::ExitCode};

use axio_core::{Workspace, discover_repository};

fn main() -> ExitCode {
    let arguments: Vec<String> = env::args().skip(1).collect();

    match arguments.as_slice() {
        [command] if command == "version" || command == "--version" => {
            println!("axio {}", env!("CARGO_PKG_VERSION"));
            ExitCode::SUCCESS
        }
        [command] if command == "status" => print_status(false),
        [command, format] if command == "status" && format == "--json" => print_status(true),
        [] => {
            print_help();
            ExitCode::SUCCESS
        }
        _ => {
            eprintln!("unknown command\n");
            print_help();
            ExitCode::from(2)
        }
    }
}

fn print_status(json: bool) -> ExitCode {
    let mut workspace = Workspace::demo();
    if let Ok(repository) = discover_repository() {
        workspace.attach_repository(repository);
    }
    let snapshot = workspace.snapshot();

    if json {
        match serde_json::to_string_pretty(&snapshot) {
            Ok(document) => println!("{document}"),
            Err(error) => {
                eprintln!("failed to serialize workspace: {error}");
                return ExitCode::FAILURE;
            }
        }
    } else {
        println!("{} · {}", snapshot.project, snapshot.branch);
        for agent in snapshot.agents {
            println!("- {} · {:?} · {}", agent.name, agent.status, agent.task);
        }
    }

    ExitCode::SUCCESS
}

fn print_help() {
    println!(
        "Axio agent workspace\n\nUSAGE:\n    axio <COMMAND>\n\nCOMMANDS:\n    status [--json]\n    version"
    );
}
