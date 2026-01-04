---
description: Dynamic application testing workflow for verifying features and UI components
---

// turbo-all

1. **Analyze Input**: Determine which specific feature, component, or workflow needs testing based on the command context (e.g., "/test-app admin-panel" or "/test-app inventory-search").
2. **Setup Environment**: Ensure the dev server is running. If not, start it using `npm run dev` in the background.
3. **Run Unit Tests**: If there are relevant Vitest/Jest files for the target, run them using `npx vitest run [path/to/test]`.
4. **Visual Verification**:
   - Open the browser to the relevant URL (usually `http://localhost:3000/` or a specific route).
   - Use the `browser_subagent` to interact with the UI:
     - Log in if necessary.
     - Navigate to the component.
     - Perform the actions described in the test objective.
     - Capture screenshots or recordings as evidence.
5. **Report Results**: 
   - Create or update `walkthrough.md` with:
     - A summary of what was tested.
     - Test results (Pass/Fail).
     - Screenshots/Recordings showing the feature in action.
     - Any identified bugs or regressions.