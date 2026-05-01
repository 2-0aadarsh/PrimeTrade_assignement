/** layout="auth" = narrow column for sign-in flows only. Subtitles do NOT imply narrow layout. */
function PageContainer({ title, subtitle, children, layout = "default" }) {
  const isAuthLayout = layout === "auth";
  return (
    <main className="page">
      <section className={`page-section${isAuthLayout ? " page-section--auth" : ""}`}>
        <header className="page-header">
          <h1>{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </header>
        {children}
      </section>
    </main>
  );
}

export default PageContainer;
