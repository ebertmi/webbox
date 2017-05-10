// Native Javascript for Bootstrap 3 | Dropdown
// by dnp_theme

// DROPDOWN DEFINITION
// ===================
class Dropdown {
  constructor(element) {
    this.menu = typeof element === 'object' ? element : document.querySelector(element);
    this.init();

    this.handle = this.handle.bind(this);
    this.toggle = this.toggle.bind(this);
    this.key = this.key.bind(this);
  }

  init() {
    this.menu.setAttribute('tabindex', '0'); // Fix onblur on Chrome | Safari
    document.addEventListener('click', evt => {
      this.handle(evt);
    }, false);
  }

  handle(e) {
    const target = e.target || e.currentTarget;
    if ( target === this.menu || target.parentNode === this.menu ) {
      this.toggle(e);
    } else if (target.closest('.dropdown form')) {
      // this prevents the dropdown from closing, when there was a click
      // in a form
      e.preventDefault();
      return;
    } else {
      this.close(200);
    }
    /#$/g.test(target.href) && e.preventDefault();
  }

  toggle() {
    if (/open/.test(this.menu.parentNode.className)) {
      this.close(0);
      document.removeEventListener('keydown', this.key, false);
    } else {
      this.menu.parentNode.className += ' open';
      this.menu.setAttribute('aria-expanded',true);
      document.addEventListener('keydown', this.key, false);
    }
  }

  key(e) {
    if (e.which == 27) {
      this.close(0);
    }
  }

  close(t) {
    setTimeout(() => { // links inside dropdown-menu don't fire without a short delay
      this.menu.parentNode.className = this.menu.parentNode.className.replace(' open','');
      this.menu.setAttribute('aria-expanded',false);
    }, t);
  }
}

// DROPDOWN DATA API
// =================
if (typeof document != 'undefined') {
  const Dropdowns = document.querySelectorAll('[data-toggle=dropdown]');
  let i = 0;
  const ddl = Dropdowns.length;

  for (i; i < ddl; i++) {
    new Dropdown(Dropdowns[i]);
  }
}


export default Dropdown;