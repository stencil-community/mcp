/**
 * Authoritative Stencil decorator + lifecycle reference.
 *
 * Descriptions are sourced from Stencil's own public runtime type
 * declarations (`src/declarations/stencil-public-runtime.ts`) so the guidance
 * an AI agent receives matches the installed framework rather than a guess.
 *
 * Stencil 5 content was checked against the `v5` branch of stenciljs/core at
 * 56b8bdd3 (5.0.0-rc), in `packages/core/src/declarations/stencil-public-runtime.ts`
 * and `BREAKING_CHANGES.md`.
 */

import type { VersionChange } from '../versionFilter.js';

export interface DecoratorDoc {
  name: string;
  signature: string;
  summary: string;
  docsUrl: string;
  /** Minimal idiomatic usage snippet. */
  example: string;
  /** Common mistakes agents make that this decorator replaces. */
  antiPattern?: string;
  /**
   * Stencil version this decorator was introduced in, when it is not part of
   * the original API. Omitted for decorators available since Stencil 1.x.
   */
  since?: string;
  /** How the API differs in later versions, oldest first. */
  changes?: VersionChange<DecoratorDoc>[];
}

export const DECORATORS: DecoratorDoc[] = [
  {
    name: 'Component',
    signature: '@Component(opts?: ComponentOptions)',
    summary:
      'Provides metadata about the component class, such as its custom element tag name, associated styles, and shadow/scoped encapsulation.',
    docsUrl: 'https://stenciljs.com/docs/component',
    example: `@Component({\n  tag: 'my-button',\n  styleUrl: 'my-button.css',\n  shadow: true,\n})\nexport class MyButton {}`,
    changes: [
      {
        since: '5.0.0',
        note: '`encapsulation` replaces `shadow` and `scoped`; `formAssociated` is replaced by @AttachInternals().',
        override: {
          summary:
            "Provides metadata about the component class, such as its custom element tag name, associated styles, and encapsulation ('shadow', 'scoped' or 'none'; defaults to 'none').",
          example: `@Component({\n  tag: 'my-button',\n  styleUrl: 'my-button.css',\n  encapsulation: { type: 'shadow' },\n})\nexport class MyButton {}`,
          antiPattern:
            'Do not use `shadow`, `scoped` or `formAssociated` in @Component(); they were replaced in Stencil 5.',
        },
      },
    ],
  },
  {
    name: 'Prop',
    signature: '@Prop(opts?: PropOptions)',
    summary:
      'Declares a custom attribute/property exposed publicly on the element that developers can set. Used to pass data from parent to child. Any value change to a Prop causes a re-render.',
    docsUrl: 'https://stenciljs.com/docs/properties',
    example: `@Prop() name: string;\n@Prop({ reflect: true }) disabled = false;`,
    antiPattern:
      'Do not mutate a @Prop from inside the component; treat it as read-only input. Use @State for internal mutable data.',
    changes: [
      {
        since: '5.0.0',
        note: 'A boolean prop is true whenever its attribute is present, including `disabled="false"`. After the first render, reflected attributes update as soon as the prop changes.',
        override: {
          antiPattern:
            'Do not mutate a @Prop from inside the component; treat it as read-only input. Use @State for internal mutable data. Do not write `attr="false"` for a boolean prop: remove the attribute or set the property to false.',
        },
      },
    ],
  },
  {
    name: 'State',
    signature: '@State()',
    summary:
      'Manages internal, private data for a component. External callers cannot modify it, but the component can. Any change causes render() to be called again.',
    docsUrl: 'https://stenciljs.com/docs/state',
    example: `@State() isOpen = false;`,
    antiPattern:
      'Do not use a plain class field for reactive internal data — changes will not trigger a re-render. Use @State.',
  },
  {
    name: 'Watch',
    signature: '@Watch(propName: string)',
    summary:
      'Calls the decorated method when a @Prop or @State value changes, receiving the new and old values. Useful for validation and side effects. Does not fire on initial component load.',
    docsUrl: 'https://stenciljs.com/docs/reactive-data#watch-decorator',
    example: `@Prop() value: string;\n\n@Watch('value')\nvalidateValue(newValue: string, oldValue: string) {\n  // react to the change\n}`,
    changes: [
      {
        since: '4.40.0',
        note: 'Accepts an `immediate` option.',
        override: { signature: '@Watch(propName: string, opts?: { immediate?: boolean })' },
      },
      {
        since: '5.0.0',
        note: 'Handlers never fire before the component has first rendered, unless `immediate: true` is set.',
        override: {
          summary:
            'Calls the decorated method when a @Prop or @State value changes, receiving the new and old values. Useful for validation and side effects. Does not fire until the component has first rendered, unless `immediate: true` is set.',
          docsUrl: 'https://stenciljs.com/docs/reactive-data',
        },
      },
    ],
  },
  {
    name: 'Element',
    signature: '@Element()',
    summary:
      'Provides a reference to the host element once it has rendered.',
    docsUrl: 'https://stenciljs.com/docs/host-element',
    example: `@Element() el: HTMLElement;`,
  },
  {
    name: 'Event',
    signature: '@Event(opts?: EventOptions)',
    summary:
      'Declares a custom DOM event emitter. Lets other components handle emitted data and lets Stencil auto-generate types and documentation for the event payload.',
    docsUrl: 'https://stenciljs.com/docs/events',
    example: `@Event() todoCompleted: EventEmitter<Todo>;\n\nonComplete(todo: Todo) {\n  this.todoCompleted.emit(todo);\n}`,
    antiPattern:
      'Do not call element.dispatchEvent(new CustomEvent(...)) manually; use @Event() so Stencil generates types and docs for the payload.',
  },
  {
    name: 'Listen',
    signature: "@Listen(eventName: string, opts?: ListenOptions)",
    summary:
      'Listens for DOM events (including those dispatched from @Event()) via a decorated method.',
    docsUrl: 'https://stenciljs.com/docs/events#listen-decorator',
    example: `@Listen('click')\nhandleClick(ev: MouseEvent) {\n  // handle the event\n}`,
    antiPattern:
      "Do not add window/document event listeners manually inside connectedCallback/componentWillLoad; use the @Listen() decorator so Stencil manages add/remove for you.",
  },
  {
    name: 'Method',
    signature: '@Method()',
    summary:
      'Exposes a class method on the public API of the element so it can be called from outside the component. Decorated methods must be async.',
    docsUrl: 'https://stenciljs.com/docs/methods',
    example: `@Method()\nasync open() {\n  this.isOpen = true;\n}`,
    antiPattern:
      'Public @Method() functions must return a Promise (be async); synchronous public methods are not supported.',
  },
  {
    name: 'AttachInternals',
    signature: '@AttachInternals()',
    summary:
      "When formAssociated is set in @Component(), provides access to the ElementInternals instance for the component (form-associated custom elements).",
    docsUrl: 'https://stenciljs.com/docs/form-associated',
    example: `@Component({ tag: 'my-input', formAssociated: true })\nexport class MyInput {\n  @AttachInternals() internals: ElementInternals;\n}`,
    since: '4.5.0',
    changes: [
      {
        since: '5.0.0',
        note: 'Makes the component form-associated by default. Pass `formAssociated: false` to use ElementInternals without form association.',
        override: {
          signature:
            '@AttachInternals(opts?: { formAssociated?: boolean; states?: { [name: string]: boolean } })',
          summary:
            'Provides access to the ElementInternals instance and makes the component form-associated, unless `formAssociated: false` is passed.',
          example: `@Component({ tag: 'my-input' })\nexport class MyInput {\n  @AttachInternals() internals: ElementInternals;\n}`,
          antiPattern: 'Do not set `formAssociated` in @Component(); it was removed in Stencil 5.',
        },
      },
    ],
  },
  {
    name: 'PropSerialize',
    signature: '@PropSerialize(propName: string)',
    summary:
      'Decorates a method that turns a @Prop value into its attribute string. Return null to remove the attribute.',
    docsUrl: 'https://stenciljs.com/docs/serialization',
    example: `@Prop({ reflect: true }) items: string[];\n\n@PropSerialize('items')\nserializeItems(value: string[]): string | null {\n  return value ? value.join(',') : null;\n}`,
    since: '4.38.0',
  },
  {
    name: 'AttrDeserialize',
    signature: '@AttrDeserialize(propName: string)',
    summary: 'Decorates a method that turns an attribute string into the @Prop value.',
    docsUrl: 'https://stenciljs.com/docs/serialization',
    example: `@Prop() items: string[];\n\n@AttrDeserialize('items')\nparseItems(value: string | null): string[] {\n  return value ? value.split(',') : [];\n}`,
    since: '4.38.0',
  },
];

export interface LifecycleDoc {
  name: string;
  summary: string;
  fires: 'once' | 'every-render' | 'conditional';
  changes?: VersionChange<LifecycleDoc>[];
}

/** Lifecycle method names verified against ComponentInterface in the source. */
export const LIFECYCLE: LifecycleDoc[] = [
  { name: 'connectedCallback', summary: 'Called every time the element is connected to the DOM.', fires: 'conditional' },
  { name: 'disconnectedCallback', summary: 'Called every time the element is disconnected from the DOM.', fires: 'conditional' },
  { name: 'componentWillLoad', summary: 'Called once, before the component first renders. May return a Promise; rendering waits for it. Ideal for async data needed before first paint.', fires: 'once' },
  { name: 'componentDidLoad', summary: 'Called once, after the component has fully loaded and rendered for the first time.', fires: 'once' },
  { name: 'componentShouldUpdate', summary: 'Called before re-render (not on first render). Return false to skip the render.', fires: 'conditional', changes: [
    {
      since: '5.0.0',
      note: 'Called once per render cycle with a single `changes` map, instead of once per changed member with (newVal, oldVal, propName).',
      override: {
        summary: 'Called once before a re-render (not on first render) with a `changes` map of every changed prop/state name to { newVal, oldVal }. Return false to skip the render.',
      },
    },
  ] },
  { name: 'componentWillRender', summary: 'Called before every render.', fires: 'every-render' },
  { name: 'componentDidRender', summary: 'Called after every render.', fires: 'every-render' },
  { name: 'componentWillUpdate', summary: 'Called before every render that is not the first (an update).', fires: 'conditional' },
  { name: 'componentDidUpdate', summary: 'Called after every render that is not the first (an update).', fires: 'conditional' },
  { name: 'render', summary: 'Returns the JSX to render. Must be pure and free of side effects.', fires: 'every-render' },
];
