import Notiflix from "notiflix";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import { galleryMarkup } from "./gallerymarkup";
import { fetchPics } from "./fetch";

export const refs = {
  formEl: document.querySelector('.search-form'),
  buttonEl: document.querySelector('.submit'),
  galleryEl: document.querySelector('.gallery'),
  inputEl: document.querySelector('input[name="searchQuery"]'),
  observer: document.querySelector('.observer'),
  loadBtn: document.querySelector('.load-more')
};

let currentPage = 1;
let currentValue = '';
let isNextPageLoad = false;
let isLastBatchLoaded = false;
let totalHits = 0;

const onFormSubmit = (e) => {
  e.preventDefault();
  const inputValue = refs.inputEl.value.trim();
  if (inputValue === '') {
    return;
  }
  currentPage = 1;
  currentValue = inputValue;
  refs.galleryEl.textContent = '';
  isNextPageLoad = false;
  isLastBatchLoaded = false;

  performSearch(currentValue);

  e.currentTarget.reset();
};

const performSearch = (inputValue) => {
  fetchPics(inputValue, currentPage)
    .then((data) => {
      if (data.hits.length === 0) {
        Notiflix.Notify.failure("Вибачте, немає зображень, що відповідають вашому запиту. Будь ласка, спробуйте ще раз.");
        return;
      }

      if (!isNextPageLoad && currentPage === 1) {
        totalHits = data.totalHits;
        Notiflix.Notify.info(`Ура! Ми знайшли ${totalHits} зображень.`);
      }

      galleryMarkup(data);
      galleryLightbox.refresh();
      observer.observe(refs.observer);
      scrollToNextGroup();

      if (isLastBatchLoaded) {
        observer.unobserve(refs.observer);
        Notiflix.Notify.info("Ви досягли кінця результатів пошуку.");
        return;
      }

      if (currentPage * 40 < totalHits) {
        currentPage++;
        isNextPageLoad = true;
      } else {
        isLastBatchLoaded = true;
        Notiflix.Notify.info("Ви досягли кінця результатів пошуку.");
      }
    })
    .catch((error) => {
      console.error(error.message);
    })
    .finally(() => {
      isNextPageLoad = false;
    });
};


const options = {
  root: null,
  rootMargin: "300px",
  threshold: 0,
};

const onLoadMore = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !isNextPageLoad && !isLastBatchLoaded) {
      performSearch(currentValue);
    }
  });
};

const observer = new IntersectionObserver(onLoadMore, options);

const optionsEl = { captionData: 'alt', captionDelay: '250' };
const galleryLightbox = new SimpleLightbox('.gallery a', optionsEl);

const scrollToNextGroup = () => {
  const { height: cardHeight } = refs.galleryEl.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: "smooth",
  });
};

refs.formEl.addEventListener('submit', onFormSubmit);