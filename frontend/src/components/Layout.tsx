*** Begin Patch
*** Update File: frontend/src/components/Layout.tsx
@@
-      <nav className="mt-3 flex gap-2 overflow-x-auto xl:hidden">{navigation.map(x=><NavLink key={x.to} to={x.to} end={x.end} className={({isActive})=>`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${isActive?"bg-brand-500 text-white":"bg-slate-100 dark:bg-slate-800"}`}>{x.label}</NavLink>)}</nav></header><main className="space-y-4">{children}</main>
+      <nav className="mt-3 flex gap-2 overflow-x-auto xl:hidden">{navigation.map(x=><NavLink key={x.to} to={x.to} end={x.end} className={({isActive})=>`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${isActive?"bg-brand-500 text-white":"bg-slate-100 dark:bg-slate-800"}`}>{x.label}</NavLink>)}</nav></header><main className="space-y-4">{children}</main>
*** End Patch