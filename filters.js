class Filters {
  constructor(elementId, data, onFilter) {
    this.elementId = elementId;
    this.data = Array.isArray(data) ? data.slice() : [];
    this.onFilter = typeof onFilter === 'function' ? onFilter : () => {};
  this.selectedModule = '';
  this.selectedApplication = '';
  this.selectedFirstRelease = '';
    this._render();
  }

  _getUniqueValues(key) {
    return [...new Set(this.data.map(item => item[key]).filter(Boolean))];
  }

  _render() {
    const container = document.getElementById(this.elementId);
    if (!container) return;
    container.innerHTML = '';

    // Add minimal style
    if (!document.getElementById('filter-component-style')) {
      const style = document.createElement('style');
      style.id = 'filter-component-style';
      style.innerHTML = `
        .filter-component-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-radius: 10px;
          padding: 18px 16px;
          max-width: 260px;
          box-shadow: 0 2px 8px rgba(116,216,202,0.08);
        }
        .filter-component-wrapper select, .filter-component-wrapper button {
          font-size: 1rem;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid #a5a8a9;
          background: white;
          color: #222;
          outline: none;
          transition: border 0.2s;
        }
        .filter-component-wrapper select:focus, .filter-component-wrapper button:focus {
          border-color: #a5a8a9;
        }
        .filter-component-wrapper button {
          background: #476fa0ff;
          color: #fff;
          border: none;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'filter-component-wrapper';

    // First Release dropdown
    const firstReleases = this._getUniqueValues('first release');
    const firstReleaseSelect = document.createElement('select');
    firstReleaseSelect.innerHTML = `<option value="">All First Releases</option>` +
      firstReleases.map(fr => `<option value="${fr}">${fr}</option>`).join('');
    firstReleaseSelect.value = this.selectedFirstRelease;
    firstReleaseSelect.addEventListener('change', (e) => {
      this.selectedFirstRelease = e.target.value;
      this._onFilterChange();
    });

    // Module dropdown
    const modules = this._getUniqueValues('module');
    const moduleSelect = document.createElement('select');
    moduleSelect.innerHTML = `<option value="">All Modules</option>` +
      modules.map(m => `<option value="${m}">${m}</option>`).join('');
    moduleSelect.value = this.selectedModule;
    moduleSelect.addEventListener('change', (e) => {
      this.selectedModule = e.target.value;
      this._onFilterChange();
    });

    // Application dropdown
    const applications = this._getUniqueValues('application');
    const appSelect = document.createElement('select');
    appSelect.innerHTML = `<option value="">All Applications</option>` +
      applications.map(a => `<option value="${a}">${a}</option>`).join('');
    appSelect.value = this.selectedApplication;
    appSelect.addEventListener('change', (e) => {
      this.selectedApplication = e.target.value;
      this._onFilterChange();
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      this.selectedModule = '';
      this.selectedApplication = '';
      this.selectedFirstRelease = '';
      moduleSelect.value = '';
      appSelect.value = '';
      firstReleaseSelect.value = '';
      this._onFilterChange();
    });

    wrapper.appendChild(appSelect);
    wrapper.appendChild(moduleSelect);
    wrapper.appendChild(firstReleaseSelect);
    wrapper.appendChild(resetBtn);
    container.appendChild(wrapper);
  }

  _onFilterChange() {
    let filtered = this.data.filter(item => {
      const moduleMatch = this.selectedModule ? item.module === this.selectedModule : true;
      const appMatch = this.selectedApplication ? item.application === this.selectedApplication : true;
      const firstReleaseMatch = this.selectedFirstRelease ? item['first release'] === this.selectedFirstRelease : true;
      return moduleMatch && appMatch && firstReleaseMatch;
    });
    this.onFilter(filtered);
  }
}
