// Get the popup trigger element
const popupTrigger = document.querySelector('.popup-trigger');

// Toggle the popup when clicking the trigger
popupTrigger.addEventListener('click', function (e) {
  e.stopPropagation();
  popupTrigger.classList.toggle('open');
});

// Close the popup when clicking outside
document.addEventListener('click', function () {
  popupTrigger.classList.remove('open');
});

// Prevent popup from closing when clicking inside it
popupTrigger.querySelector('.popup-content').addEventListener('click', function (e) {
  e.stopPropagation();
});
