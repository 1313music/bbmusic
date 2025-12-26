document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const hamburgerNav = document.getElementById('hamburger-nav');
    
    if (!hamburgerMenu || !hamburgerNav) return;
    
    hamburgerMenu.addEventListener('click', function() {
        hamburgerMenu.classList.toggle('active');
        hamburgerNav.classList.toggle('active');
        event.stopPropagation();
    });
    
    const navItems = document.querySelectorAll('.hamburger-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            hamburgerMenu.classList.remove('active');
            hamburgerNav.classList.remove('active');
        });
    });
    
    document.addEventListener('click', function(event) {
        if (!hamburgerMenu.contains(event.target) && !hamburgerNav.contains(event.target)) {
            hamburgerMenu.classList.remove('active');
            hamburgerNav.classList.remove('active');
        }
    });
    
    hamburgerNav.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});
