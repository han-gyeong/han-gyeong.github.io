(function () {
  if (typeof mermaid === 'undefined') return;

  // Convert fenced ```mermaid blocks into <div class="mermaid"> for rendering.
  const codeBlocks = document.querySelectorAll('pre > code.language-mermaid, pre > code.mermaid');
  codeBlocks.forEach((code) => {
    const pre = code.parentElement;
    if (!pre || pre.dataset.mermaidProcessed === 'true') return;

    const diagram = document.createElement('div');
    diagram.className = 'mermaid';
    diagram.textContent = code.textContent || '';

    pre.replaceWith(diagram);
  });

  const hasDiagram = document.querySelector('.mermaid');
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
