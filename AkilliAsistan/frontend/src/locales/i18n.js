/*file: frontend/src/locales/i18n.js*/

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './en/translation.json';
import translationTR from './tr/translation.json';


const resources = {
  en: {
    translation: translationEN
  },
  tr: {
    translation: translationTR
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // Başlangıç dili Türkçe olsun
    fallbackLng: 'en', // Dil bulunamazsa İngilizce'ye düş
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
