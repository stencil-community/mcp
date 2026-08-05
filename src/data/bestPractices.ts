/**
 * Idiomatic StencilJS best practices, framed as concrete "do this / not that"
 * rules so an AI agent can correct its own suggestions before emitting them.
 */

export interface BestPractice {
  id: string;
  title: string;
  wrong: string;
  right: string;
  why: string;
  docsUrl?: string;
}

export const BEST_PRACTICES: BestPractice[] = [
  {
    id: 'listen-decorator',
    title: 'Use @Listen() instead of manual event listeners',
    wrong: `componentWillLoad() {\n  window.addEventListener('resize', this.onResize);\n}`,
    right: `@Listen('resize', { target: 'window' })\nonResize() {\n  // ...\n}`,
    why: 'Stencil manages listener registration and cleanup for you, avoiding leaks and boilerplate.',
    docsUrl: 'https://stenciljs.com/docs/events#listen-decorator',
  },
  {
    id: 'state-reactivity',
    title: 'Use @State() for reactive internal data',
    wrong: `private count = 0; // mutating this will NOT re-render`,
    right: `@State() count = 0;`,
    why: 'Only @State (and @Prop) changes trigger a re-render. Plain fields do not.',
    docsUrl: 'https://stenciljs.com/docs/state',
  },
  {
    id: 'async-method',
    title: 'Public @Method() must be async',
    wrong: `@Method()\nopen() { this.isOpen = true; }`,
    right: `@Method()\nasync open() { this.isOpen = true; }`,
    why: 'Public methods are invoked across the custom-element boundary and must return a Promise.',
    docsUrl: 'https://stenciljs.com/docs/methods',
  },
  {
    id: 'prop-immutability',
    title: 'Do not mutate @Prop values',
    wrong: `@Prop() items: string[];\naddItem(i: string) { this.items.push(i); }`,
    right: `@Prop() items: string[];\n@State() localItems: string[];\n// derive localItems from items and mutate that`,
    why: 'Props represent parent-owned input; mutating them breaks one-way data flow and can be overwritten on re-render.',
    docsUrl: 'https://stenciljs.com/docs/properties',
  },
  {
    id: 'render-purity',
    title: 'Keep render() free of side effects',
    wrong: `render() {\n  this.count++; // side effect during render\n  return <div>{this.count}</div>;\n}`,
    right: `render() {\n  return <div>{this.count}</div>;\n}`,
    why: 'render() can be called many times; side effects there cause bugs and infinite loops. Use lifecycle methods instead.',
  },
  {
    id: 'event-emitter',
    title: 'Emit custom events with @Event()',
    wrong: `this.el.dispatchEvent(new CustomEvent('change', { detail }));`,
    right: `@Event() change: EventEmitter<Detail>;\n// ...\nthis.change.emit(detail);`,
    why: 'Stencil generates typed docs and consistent event metadata for @Event() emitters.',
    docsUrl: 'https://stenciljs.com/docs/events',
  },
];
