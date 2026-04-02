# 🎯 Perfect Circle — AI Game (Hill Climbing)

🚀 Live Demo
👉 https://pranavkule.github.io/perfect_circle_game/

## 📌 Overview
This is a simple web-based game where the user attempts to draw a perfect circle using mouse input.  
The system evaluates the drawing using a Hill Climbing optimization algorithm to estimate the best-fit circle and calculate accuracy.

---

## 🧠 Concept
The game uses a basic local search technique (Hill Climbing):

- Captures user-drawn points from mouse movement
- Computes an initial circle using centroid
- Iteratively adjusts:
  - Center (x, y)
  - Radius
- Minimizes error between drawn points and circle boundary
- Stops when no better solution is found

### Output includes:
- Accuracy score
- Grade
- Best-fit circle overlay

---

## 🛠️ Tech Stack
- HTML5 Canvas
- CSS3
- Vanilla JavaScript

---

## 🎮 How to Run
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/perfect-circle-game.git
   ```

2. Open the project folder

3. Run:
   - Open `index.html` in any browser  
   **OR**
   - Use GitHub Pages link (if deployed)

---

## 🎯 How to Play
1. Click and drag your mouse to draw a circle  
2. Release the mouse  
3. View your accuracy score and result  

---

## 📚 Academic Context
- Based on Hill Climbing (Artificial Intelligence - Unit 3.1)
- Demonstrates a practical use of optimization techniques

- Pranav Kule
