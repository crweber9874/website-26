// Drop-in replacement for `next/link` when running inside Astro.
// Renders a plain anchor; forwards common props.
export default function Link({ href, children, prefetch, replace, scroll, ...rest }) {
  return (
    <a href={typeof href === "string" ? href : href?.pathname || "#"} {...rest}>
      {children}
    </a>
  );
}
