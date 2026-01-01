# 🧰 Tool Box

A collection of lightweight, open-source web tools designed to simplify everyday development and design tasks. All tools run entirely in the browser—no server required and no data leaves your device.

## 🚀 Live Demo

Check out the live site here: **[https://kaisingl.github.io/tool-box/](https://kaisingl.github.io/tool-box/)**

## 🛠️ Available Tools

### Chrome Extension Promo Cropper
A dedicated image cropper for Chrome Web Store assets. It simplifies the process of preparing images by handling the math for you.
- **Features:**
  - Zoom-to-cursor functionality for precise cropping.
  - Locked aspect ratio during zoom.
  - Pre-set dimensions for all Chrome Web Store requirements:
    - Small Promo (440×280)
    - Marquee (1400×560)
    - Screenshot Large (1280×800)
    - Screenshot Small (640×400)
    - Icon (128×128)
  - Direct PNG download.
- **Tech:** HTML5 Canvas, Vanilla JS, Tailwind CSS.

## 🛠️ Tech Stack

This project is built with simplicity and performance in mind:

- **HTML5 & CSS3**: Semantic markup and modern styling.
- **Vanilla JavaScript**: No frameworks, just fast, native DOM manipulation.
- **Tailwind CSS**: Used via CDN for rapid, responsive UI development.
- **GitHub Pages**: For static hosting and CI/CD.

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
