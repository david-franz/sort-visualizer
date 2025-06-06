# Sort Wars

A small side-project that visualises classic sorting algorithms in real time.  
It’s written in React and uses a read-only Monaco Editor so you can look at the implementation of each algorithm.

The current deployed code can be tried here: https://sort-visualizer-rho.vercel.app/

## What it shows

| Algorithm | Colour | Notes |
|-----------|--------|-------|
| Bubble Sort      | blue   | step-by-step swaps |
| Selection Sort   | pink   | min-swap each pass |
| Insertion Sort   | orange | running insert window |
| Merge Sort       | green  | recursive merge snapshots |
| Quick Sort       | yellow | Lomuto partition, every swap |

Each row ticks as it moves, counts the steps it took and tells you how long it needed.  
You can run, pause, step, stop, or reset algorithms individually – or do the same for all rows from the top toolbar.

## Getting it running locally

```bash
# clone and install
git clone https://github.com/<your-user>/<repo>.git
cd <repo>
npm install

# start dev server
npm run dev      # vite will open http://localhost:5173
