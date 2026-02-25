# 🧰 Web Tools Hub

A collection of lightweight, open-source browser utilities. All tools run entirely in your browser—no server required and no data leaves your device.

## 🚀 Live Demo

Check out the live site here: **[https://kaisingl.github.io/tool-box/](https://kaisingl.github.io/tool-box/)**

## 🛠️ Available Tools

### Chrome Promo Cropper
Quickly crop and resize images for the Chrome Web Store. Supports Small Promo, Marquee, Screenshots, and Icons.
- **Features:**
  - Zoom-to-cursor functionality for precise cropping
  - Locked aspect ratio during zoom
  - Pre-set dimensions for all Chrome Web Store requirements:
    - Small Promo (440×280)
    - Marquee (1400×560)
    - Screenshot Large (1280×800)
    - Screenshot Small (640×400)
    - Icon (128×128)
  - Direct PNG download
- **Tech:** HTML5 Canvas, Vanilla JavaScript

### Icon Resizer
Resize icons to multiple standard sizes at once. Perfect for web and mobile development.
- **Features:**
  - Bulk resize to multiple dimensions
  - Common icon presets (16×16, 32×32, 64×64, 128×128, 256×256, 512×512)
  - Download as ZIP file
  - Drag & drop support
- **Tech:** HTML5 Canvas, Vanilla JavaScript, JSZip, FileSaver.js

### QR Code Generator
Generate QR codes for various types. Supports WiFi networks, URLs, text, and more.
- **Features:**
  - Multiple QR code types: WiFi, URL, Text, Email, Phone, SMS
  - Optional logo overlay for WiFi QR codes
  - Download QR code as PNG
  - Works on all devices with QR scanner
- **Tech:** QRCode.js, Vanilla JavaScript

### SVG Icon Collection
Browse and copy ready-to-use SVG icons. Includes UI icons, symbols, and decorative elements.
- **Features:**
  - Curated collection of SVG icons
  - One-click copy to clipboard
  - Clean, minimal icon designs
  - Perfect for web projects
- **Tech:** Vanilla JavaScript

### String Formatter
Format word lists with quotes, delimiters, and line breaks.
- **Features:**
  - Add quotes and delimiters to lists
  - Control words per line
  - Include/exclude trailing delimiters
  - Ignore blank lines option
  - Copy formatted output to clipboard
- **Tech:** Vanilla JavaScript

### Frame Grabber
Extract frames from videos as PNG images. Upload a video and grab any frame instantly.
- **Features:**
  - Custom timeline scrubber with 0.1s step controls
  - Frame capture at exact playback position
  - Download captured frame as PNG
  - Drag & drop video support
  - View captured frames in grid
  - Bulk download all frames as ZIP
- **Tech:** HTML5 Video, Canvas, Vanilla JavaScript, JSZip, FileSaver.js

### Log Reader
View and search large log files directly in your browser. Handles files up to 10GB+.
- **Features:**
  - Streaming support for massive files (10GB+)
  - Web Worker-powered search for fast results
  - Syntax highlighting
  - Navigate to specific line numbers
  - Download by line range
  - Match navigation with keyboard shortcuts
- **Tech:** Vanilla JavaScript, Web Workers

### Gif Frame Grabber
Extract frames from animated GIFs as PNG images.
- **Features:**
  - Browse and select frames from GIF
  - Download individual frames
  - Bulk download all frames as ZIP
- **Tech:** HTML5 Canvas, Vanilla JavaScript, JSZip, FileSaver.js

## 🛠️ Tech Stack

This project is built with simplicity and performance in mind:

- **HTML5 & CSS3**: Semantic markup and modern styling
- **Vanilla JavaScript**: No frameworks, just fast, native DOM manipulation
- **Neo-Brutalist CSS**: Custom design system for a bold, distinctive aesthetic
- **GitHub Pages**: For static hosting and CI/CD

## 📦 Installation & Usage

Since these tools are client-side only, you don't need a complex backend to run them.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kaisingl/tool-box.git
    ```

2.  **Navigate to the project folder:**
    ```bash
    cd tool-box
    ```

3.  **Run locally:**
    Because the tools use ES modules or strict CORS policies in some browsers, it is best to use a local server.
    -   **Using Python 3:**
        ```bash
        python3 -m http.server
        ```
    -   **Using Node.js (http-server):**
        ```bash
        npx http-server
        ```
    -   **Using VS Code:** Install the "Live Server" extension and click "Go Live".

4.  Open your browser to `http://localhost:8000` (or the port provided by your server).

## 🤝 Contributing

Contributions are welcome! If you have a tool idea or a bug fix, feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingTool`)
3. Commit your Changes (`git commit -m 'Add some AmazingTool'`)
4. Push to the Branch (`git push origin feature/AmazingTool`)
5. Open a Pull Request

## 📄 License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

---

Made with ❤️ by [KaisingL](https://github.com/kaisingl)
