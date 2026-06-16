# Decision Tree — Which Sub-Skill to Load

This tree is for the agent (or a developer reading this for the first time). Start at the
top and follow the first matching branch.

```
User request
│
├── Pure "how do I use component X / API Y" question
│   └── → uniapp-project (需单独安装) — stop here
│
├── "I'm starting a new uni-app project"
│   └── → uniapp-architect (entry)
│         → uniapp-fundamentals (scaffolding, config)
│         → uniapp-scaffolder (filtered/template scaffold)
│         → uniapp-platform-config (target platform setup)
│
├── "I'm migrating Vue 2 → Vue 3" or "Vue 3 → uni-app x"
│   └── → uniapp-architect → uniapp-fundamentals (vue2-vs-vue3-vs-uvue)
│         → uniapp-state-and-data (Vuex → Pinia if applicable)
│
├── Touches a specific layer:
│   ├── Project structure / pages.json / manifest.json / App.vue / main.js
│   │   └── → uniapp-fundamentals
│   ├── Page navigation / tabBar / deep link / custom nav
│   │   └── → uniapp-routing-and-tabbar
│   ├── Pinia / storage / global state / persistence
│   │   └── → uniapp-state-and-data
│   ├── uni.request / uni.uploadFile / API wrapper / interceptors
│   │   └── → uniapp-network-layer
│   ├── List / form / pull-refresh / popup / skeleton / empty state
│   │   └── → uniapp-ui-patterns
│   ├── Multi-platform deploy / WeChat appid / iOS signing / #ifdef
│   │   └── → uniapp-platform-config
│   ├── Slow / lag / big bundle / many items / first paint
│   │   └── → uniapp-performance
│   ├── Bug / crash / upload / publish / CI / hot update
│   │   └── → uniapp-debugging-and-publishing
│   ├── Add tests / mock uni.* / E2E on H5 / MP automation / test CI
│   │   └── → uniapp-testing
│   ├── Multi-language / language switcher / locale formatting / RTL
│   │   └── → uniapp-i18n
│   ├── uniCloud / cloud DB / cloud storage / uni-id auth / serverless deploy
│   │   └── → uniapp-cloud
│   ├── WeChat Pay / Alipay / Apple Pay / Google Pay / refunds
│   │   └── → uniapp-payments
│   ├── Offline push / WeChat 订阅消息 / push tokens
│   │   └── → uniapp-uni-push
│   ├── Dark mode / theme switching / brand colors / token system
│   │   └── → uniapp-theming
│   ├── Taro / native MP / Vue 2 → uni-app migration
│   │   └── → uniapp-migration
│   ├── Package as a uni_modules plugin / UTS native plugin / publish
│   │   └── → uniapp-plugin-authoring
│   └── Pick / install / configure a third-party UI library
│       └── → uniapp-ui-libraries
│
└── Spans multiple layers
    └── → uniapp-architect (entry)
          → load each relevant sub-skill in this order:
             1. uniapp-fundamentals        (project shape)
             2. uniapp-platform-config     (target platform)
             3. uniapp-routing-and-tabbar  (page flow)
             4. uniapp-state-and-data      (data layer)
             5. uniapp-network-layer       (server I/O — traditional)
             6. uniapp-cloud               (serverless backend, alternative to 5)
             7. uniapp-ui-patterns         (screen patterns)
             8. uniapp-ui-libraries        (UI library setup — if not using uni-ui only)
             9. uniapp-i18n                (if multi-language)
            10. uniapp-theming             (if dark mode / brand override)
            11. uniapp-payments            (if charging money)
            12. uniapp-uni-push           (if sending notifications)
            13. uniapp-performance        (only if perf issue or large scale)
            14. uniapp-testing             (CI / pre-release)
            15. uniapp-debugging-and-publishing (when shipping)
            16. uniapp-migration           (only when porting an existing project)
            17. uniapp-plugin-authoring    (only when packaging code for re-use)
```

## Don't load all skills at once

The skills are designed to be loaded **on demand**. The agent should:

1. Read `uniapp-architect/SKILL.md` first to orient.
2. Load only the sub-skill(s) that match the current question.
3. Cross-reference other sub-skills only when the current layer's decision points to them
   (e.g. `uniapp-state-and-data` may point to `uniapp-routing-and-tabbar` for "where do I
   redirect after login").

Loading all 18 at once burns context and confuses the model with overlapping guidance.

## When the user has multiple questions

If the user asks "build me a logged-in shopping list with offline support, deploy to
WeChat MP and H5", break it down:

1. Read `uniapp-architect` to confirm the layered plan.
2. Ask one quick clarifying question **only if** the answer changes the architecture
   (e.g. "Vue 2 or Vue 3?" — but you can default to Vue 3 if they're new).
3. Build out the answer in skill-load order, citing each sub-skill you used.

Don't ask "do you want Vue 2 or Vue 3 or uvue AND HBuilderX or CLI AND WeChat MP or H5?"
in a single popup — pick sensible defaults, surface them inline, and let the user
correct any that are wrong.
