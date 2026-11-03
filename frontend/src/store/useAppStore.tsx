*** Begin Patch
*** Update File: frontend/src/store/useAppStore.tsx
@@
-      set({
-        selectedConfigIds:
-          configs.length > 0
-            ? configs.map((config) => `${config.algo}|${config.method}`)
-            : [],
-      });
+      set({ selectedConfigIds: [] });
*** End Patch