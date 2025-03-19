# 🖥️ Retro Hardware Inventory System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/flask-2.0+-orange.svg)

<p align="center">
  <img src="https://i.imgur.com/placeholder-image.png" alt="Retro Hardware Inventory" width="800">
  <br>
  <em>A synthwave-styled inventory management system for electronic components</em>
</p>

## ✨ Features

- **Retro 80s UI** - Neon colors, grid backgrounds, and synthwave aesthetics
- **Natural Language Input** - Add components using plain language descriptions
- **Duplicate Detection** - Automatic identification and merging of similar components
- **Category Management** - Organize components by custom categories
- **Search & Filter** - Find components by name, category, specifications, etc.
- **Visual Feedback** - Animated component additions with satisfying transitions
- **Storage Locations** - Track where components are physically stored
- **Quick Edit/Delete** - Efficient component management with minimal clicks
- **Component Highlighting** - New components stand out with glowing effects
- **Responsive Design** - Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/retro-hardware-inventory.git
   cd retro-hardware-inventory
   ```

2. **Set up a virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize the database**
   ```bash
   python -c "from database import init_db; init_db()"
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the inventory system**
   Open your browser and navigate to `http://localhost:5000`

## 💻 Usage

### Adding Components

Simply type a description of your component in the input field: 