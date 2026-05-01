function Loader({ label = "Loading..." }) {
  return (
    <section aria-live="polite" className="loader-wrap">
      <p>{label}</p>
    </section>
  );
}

export default Loader;
