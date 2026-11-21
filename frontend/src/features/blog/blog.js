(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .controller("BlogController", [
      function BlogController() {
        const ctrl = this;
        ctrl.searchText = "";
        ctrl.selectedCategory = "Todos";
        ctrl.categories = ["Todos", "Cardiología", "Nutrición", "Salud Mental"];

        ctrl.featured = {
          id: 1,
          category: "Cardiología Preventiva",
          minutes: 8,
          title:
            "10 Claves fundamentales para mantener una salud cardiovascular óptima",
          summary:
            "Una de las enfermedades cardiovasculares es la primera causa de muerte en México. Conoce las recomendaciones médicas actualizadas y los cambios preventivos que ayudan a reducir tu riesgo.",
          fact: "El control profesional multfamiliar ha reducido hasta 27% el riesgo de eventos cardiovasculares importantes.",
          author: "Dr. Alejandro Morales",
          authorInitials: "AM",
          authorRole: "Especialista en Cardiología",
        };

        ctrl.sideArticles = [
          {
            id: 2,
            icon: "▣",
            category: "Prevención y Chequeos",
            title: "Prevención y Chequeos",
            summary:
              "Recomendaciones prácticas sobre cuándo acudir a revisión médica, estudios periódicos por edad y análisis.",
            author: "Dr. Elena Ramos",
            authorInitials: "ER",
            authorRole: "Medicina Familiar",
            minutes: 6,
          },
          {
            id: 3,
            icon: "♨",
            category: "Nutrición y Salud Familiar",
            title: "Nutrición y Salud Familiar",
            summary:
              "Pautas de alimentación balanceada con respaldo científico para mejorar energía y prevenir enfermedades.",
            author: "Lic. Roberto Silva",
            authorInitials: "RS",
            authorRole: "Nutriólogo",
            minutes: 7,
          },
          {
            id: 4,
            icon: "◉",
            category: "Psicología y Salud Mental",
            title: "Psicología y Bienestar",
            summary:
              "Estrategias estructuradas para manejar el estrés cotidiano, mejorar el descanso y apoyar la salud mental.",
            author: "Dra. Marcela Lozano",
            authorInitials: "ML",
            authorRole: "Psicóloga Clínica",
            minutes: 5,
          },
        ];

        ctrl.articles = [
          {
            id: 5,
            category: "Cardiología",
            categoryLabel: "Cardiología Preventiva",
            minutes: 6,
            title: "Hipertensión Arterial: Señales silenciosas y qué hacer",
            summary:
              "Conoce los factores de riesgo y cómo reconocer el aumento anormal de la presión.",
            author: "Dr. Elena Ramos",
            authorInitials: "ER",
            authorRole: "Cardiología",
          },
          {
            id: 6,
            category: "Nutrición",
            categoryLabel: "Nutrición y Defensas",
            minutes: 6,
            title: "Inmunología: Alimentación óptima para tus defensas",
            summary:
              "Conoce qué vitaminas, alimentos y hábitos ayudan a fortalecer tu sistema inmune.",
            author: "Lic. Roberto Silva",
            authorInitials: "RS",
            authorRole: "Nutrición",
          },
          {
            id: 7,
            category: "Salud Mental",
            categoryLabel: "Salud Emocional",
            minutes: 5,
            title: "Manejo del Estrés Cotidiano: Técnicas clínicas reales",
            summary:
              "Herramientas cognitivo-conductuales y pautas de regulación emocional.",
            author: "Dra. Marcela Lozano",
            authorInitials: "ML",
            authorRole: "Psicología Clínica",
          },
        ];

        ctrl.visibleArticles = ctrl.articles.slice();

        ctrl.filterArticles = function () {
          const term = (ctrl.searchText || "").trim().toLowerCase();
          ctrl.visibleArticles = ctrl.articles.filter(function (article) {
            const categoryMatches =
              ctrl.selectedCategory === "Todos" ||
              article.category === ctrl.selectedCategory;
            const searchable = [
              article.category,
              article.categoryLabel,
              article.title,
              article.summary,
              article.author,
            ]
              .join(" ")
              .toLowerCase();
            return categoryMatches && (!term || searchable.includes(term));
          });
        };

        ctrl.selectCategory = function (category) {
          ctrl.selectedCategory = category;
          ctrl.filterArticles();
        };

        ctrl.showAll = function () {
          ctrl.searchText = "";
          ctrl.selectedCategory = "Todos";
          ctrl.filterArticles();
        };

        ctrl.openArticle = function () {
          // Los enlaces de lectura pueden ampliarse con una vista de artículo dedicada.
        };
      },
    ])
    .component("medicalBlog", {
      templateUrl: "/features/blog/blog.html",
      bindings: { onClose: "&", onBook: "&" },
      controller: "BlogController",
    });
})();
