use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use xcap::Monitor;
use std::io::Cursor;
use image::ImageFormat;
use std::fs;
use tauri::Manager;

#[tauri::command]
fn extract_screen_text() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    if let Some(monitor) = monitors.first() {
        let image = monitor.capture_image().map_err(|e| e.to_string())?;

        // 1. Encode image to PNG in memory
        let mut buffer = Cursor::new(Vec::new());
        image
            .write_to(&mut buffer, ImageFormat::Png)
            .map_err(|e| e.to_string())?;
        let png_bytes = buffer.into_inner();

        // 2. Save temporarily to OS temp directory
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("ghost_copilot_temp.png");
        fs::write(&temp_path, png_bytes).map_err(|e| e.to_string())?;

        // 3. Convert PathBuf to &str and run Windows OCR
        let path_str = temp_path.to_str().ok_or("Invalid path string")?;
        let text_result = win_ocr::ocr(path_str).map_err(|e| format!("OCR Error: {:?}", e));

        // 4. Clean up temp file
        let _ = fs::remove_file(temp_path);

        // 5. Evaluate result
        let text = text_result?;
        if text.trim().is_empty() {
            Err("No readable text found on screen.".to_string())
        } else {
            Ok(text)
        }
    } else {
        Err("No monitor found".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![extract_screen_text])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // Permanent stealth
            let _ = window.set_content_protected(true);

            // ONLY register the Hide/Show shortcut (Alt + B)
            let toggle_vis = Shortcut::new(Some(Modifiers::ALT), Code::KeyX);

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app_handle, shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(win) = app_handle.get_webview_window("main") {
                                // Handled 100% in Rust, instant and unbreakable
                                if shortcut == &toggle_vis {
                                    if win.is_visible().unwrap_or(false) {
                                        let _ = win.hide();
                                    } else {
                                        let _ = win.show();
                                        let _ = win.set_focus();
                                    }
                                }
                            }
                        }
                    })
                    .build()
            )?;

            // Register shortcut safely
            let _ = app.global_shortcut().register(toggle_vis);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}