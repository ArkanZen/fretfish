#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 老板键：Cmd/Ctrl + Shift + H 切换窗口显示/隐藏（全局快捷键）
      #[cfg(desktop)]
      {
        use tauri::Manager;
        use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

        let boss_key = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyH);
        app.handle().plugin(
          tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
              if shortcut == &boss_key && event.state() == ShortcutState::Pressed {
                if let Some(win) = app.get_webview_window("main") {
                  if win.is_visible().unwrap_or(false) {
                    let _ = win.hide();
                  } else {
                    let _ = win.show();
                    let _ = win.set_focus();
                  }
                }
              }
            })
            .build(),
        )?;
        app.global_shortcut().register(boss_key)?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
