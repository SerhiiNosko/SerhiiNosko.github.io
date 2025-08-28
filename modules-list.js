
class ModulesList {
  constructor(containerId) {
    this.dataSource = {};
    this.modules = [];
    this.containerId = containerId;
  }

  setDataSource(modules) {
    this.dataSource = modules.reduce((acc, module) => {
      acc[module.module] = module;

      return acc;
    }, {});
  }

  _render() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = '';

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '8px 16px';
    ul.style.margin = '0';
    ul.style.overflowY = 'auto';
    ul.style.maxHeight = '445px';

    this.modules.forEach(module => {
      const moduleInfo = this.dataSource[module];
      const li = document.createElement('li');
      li.style.marginBottom = '5px';
      li.style.maxWidth = '260px';

      // Section container
      const section = document.createElement('div');
      section.style.marginBottom = '3px';
      section.style.background = '#fff';
      section.style.borderRadius = '6px';
      section.style.border = '1px solid #c5c9cbff';
      section.style.padding = '8px';

      // Title (module link)
      const link = document.createElement('a');
      link.href = `https://github.com/folio-org/${module}`;
      link.textContent = module;
      link.target = '_blank';
      link.style.fontSize = '1.3rem';
      link.style.fontWeight = 'bold';
      link.style.color = '#476fa0ff';
      link.style.marginBottom = '0.5rem';
      link.style.textDecoration = 'none';
      link.style.display = 'inline-block';
      section.appendChild(link);

      // Meta info
      const meta = document.createElement('div');
      meta.style.marginLeft = '1.5rem';
      meta.style.color = '#4a5a6a';
      meta.style.fontSize = '1rem';

      // Product owner
      const poLabel = document.createElement('span');
      poLabel.textContent = 'Product owner:';
      poLabel.style.fontWeight = '500';
      poLabel.style.color = '#6c7a89';
      meta.appendChild(poLabel);
      meta.appendChild(document.createTextNode(' ' + (moduleInfo['product owner'] || '-') ));
      meta.appendChild(document.createElement('br'));

      // Lead
      const leadLabel = document.createElement('span');
      leadLabel.textContent = 'Lead:';
      leadLabel.style.fontWeight = '500';
      leadLabel.style.color = '#6c7a89';
      meta.appendChild(leadLabel);
      meta.appendChild(document.createTextNode(' ' + (moduleInfo['dev lead/contact'] || '-') ));

      section.appendChild(meta);
      li.appendChild(section);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  render(tree) {
    const names = [];

    function traverse(node) {
      if (Array.isArray(node)) {
        node.forEach(traverse);
      } else if (node && typeof node === 'object') {
        if ('name' in node && !('children' in node)) {
          names.push(node.name);
        } else if ('children' in node) {
          traverse(node.children);
        }
      }
    }

    traverse(tree);

    this.modules = names;

    this._render();
  }
}
