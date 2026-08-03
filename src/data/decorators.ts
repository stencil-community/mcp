/**
 * Authoritative Stencil decorator + lifecycle reference.
 *
 * Descriptions are sourced from Stencil's own public runtime type
 * declarations (`src/declarations/stencil-public-runtime.ts`) so the guidance
 * an AI agent receives matches the installed framework rather than a guess.
 */

export interface DecoratorDoc {
  name: string;
  signature: string;
  summary: string;
  docsUrl: string;
  /** Minimal idiomatic usage snippet. */
  example: string;
  /** Common mistakes agents make that this decorator replaces. */
  antiPattern?: string;
}

export const DECORATORS: DecoratorDoc[] = [
  {
    name: 'Component',
    signature: '@Component(opts?: ComponentOptions)',
    summary:
      'Provides metadata about the component class, such as its custom element tag name, associated styles, and shadow/scoped encapsulation.',
    docsUrl: 'https://stenciljs.com/docs/component',
    example: `@Component({\n  tag: 'my-button',\n  styleUrl: 'my-button.css',\n  shadow: true,\n})\nexport class MyButton {}`,
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
  },
];

export interface LifecycleDoc {
  name: string;
  summary: string;
  fires: 'once' | 'every-render' | 'conditional';
}

/** Lifecycle method names verified against ComponentInterface in the source. */
export const LIFECYCLE: LifecycleDoc[] = [
  { name: 'connectedCallback', summary: 'Called every time the element is connected to the DOM.', fires: 'conditional' },
  { name: 'disconnectedCallback', summary: 'Called every time the element is disconnected from the DOM.', fires: 'conditional' },
  { name: 'componentWillLoad', summary: 'Called once, before the component first renders. May return a Promise; rendering waits for it. Ideal for async data needed before first paint.', fires: 'once' },
  { name: 'componentDidLoad', summary: 'Called once, after the component has fully loaded and rendered for the first time.', fires: 'once' },
  { name: 'componentShouldUpdate', summary: 'Called before re-render (not on first render). Return false to skip the render.', fires: 'conditional' },
  { name: 'componentWillRender', summary: 'Called before every render.', fires: 'every-render' },
  { name: 'componentDidRender', summary: 'Called after every render.', fires: 'every-render' },
  { name: 'componentWillUpdate', summary: 'Called before every render that is not the first (an update).', fires: 'conditional' },
  { name: 'componentDidUpdate', summary: 'Called after every render that is not the first (an update).', fires: 'conditional' },
  { name: 'render', summary: 'Returns the JSX to render. Must be pure and free of side effects.', fires: 'every-render' },
];
