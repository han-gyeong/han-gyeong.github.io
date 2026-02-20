(function () {
  if (typeof mermaid === 'undefined') return;
  const hasDiagram = document.querySelector('code.language-mermaid, .language-mermaid');
  if (!hasDiagram) return;
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#141a22',
      primaryTextColor: '#e6edf3',
      lineColor: '#7cc7ff'
    }
  });
})();
