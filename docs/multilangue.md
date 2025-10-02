# 🌍 Guide Multilingue -- Medaldex

Ce guide explique comment ajouter une **nouvelle page multilingue**
(FR/EN) dans Medaldex.

------------------------------------------------------------------------

## ✅ Étapes pour créer une nouvelle page

1.  Créer un nouveau dossier avec un `index.html` Exemple :
    `/contact/index.html`

2.  Inclure `i18n.js`

    ``` html
    <script src="/i18n.js" defer></script>
    ```

3.  Ajouter un sélecteur de langue

    ``` html
    <select id="langSwitcher">
      <option value="fr">🇫🇷 FR</option>
      <option value="en">🇬🇧 EN</option>
    </select>
    ```

4.  Marquer les textes traduisibles

    ``` html
    <h1 data-i18n="contact.title"></h1>
    ```

5.  Marquer les placeholders

    ``` html
    <input type="text" data-i18n-placeholder="filters.search">
    ```

6.  Variables dynamiques

    ``` html
    <h2 data-i18n="dashboard.hello" data-i18n-vars='{"name":"Jean"}'></h2>
    ```

    Dans `fr.json` : `"hello": "Bonjour {name} 👋"`\
    Dans `en.json` : `"hello": "Hello {name} 👋"`

7.  Ajouter les traductions dans `fr.json` et `en.json`

8.  Tester en FR/EN et vérifier que le choix reste après reload.

------------------------------------------------------------------------

## 📂 Arborescence recommandée

    /medaldex
      /lang
        fr.json
        en.json
      /login
        index.html
      /signup
        index.html
      /dashboard
        index.html
      /collection
        index.html
      /add
        index.html
      /profile
        index.html
      /about
        index.html
      /docs
        multilangue.md
      index.html        (Landing)
      i18n.js

------------------------------------------------------------------------

## ✨ Exemple minimal d'une nouvelle page

``` html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="contact.title"></title>
  <script src="/i18n.js" defer></script>
</head>
<body>
  <header>
    <a href="/" data-i18n="app.title"></a>
    <select id="langSwitcher">
      <option value="fr">FR</option>
      <option value="en">EN</option>
    </select>
  </header>

  <main>
    <h1 data-i18n="contact.title"></h1>
    <p data-i18n="contact.paragraph"></p>
    <form>
      <input type="text" data-i18n-placeholder="contact.name">
      <button data-i18n="contact.button"></button>
    </form>
  </main>

  <footer>
    <p data-i18n="footer.rights"></p>
  </footer>
</body>
</html>
```

------------------------------------------------------------------------

Avec ça, chaque nouvelle page est prête pour le multilingue 🚀
