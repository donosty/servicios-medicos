(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("patientReviews", {
    templateUrl: "/features/reviews/reviews.html",
    controller: function PatientReviewsController() {
      const reviews = [
        {
          name: "Mariana López",
          portrait: "/assets/testimonio-1.webp",
          comment:
            "La pediatra escuchó todas mis preguntas. Mi hija se sintió en confianza desde el primer momento.",
        },
        {
          name: "Elena Ruiz",
          portrait: "/assets/testimonio-2.webp",
          comment:
            "Me explicaron cada paso de mi consulta con calma. Agradecí mucho ese trato tan cercano.",
        },
        {
          name: "Diego Torres",
          portrait: "/assets/testimonio-3.webp",
          comment:
            "Encontré la especialidad que buscaba y desde recepción me orientaron con mucha amabilidad.",
        },
        {
          name: "Ana Vega",
          initials: "AV",
          comment:
            "Pude acompañar a mi mamá a su consulta. El equipo nos dedicó tiempo para resolver nuestras dudas.",
        },
      ];

      let first = 0;
      this.visible = reviews.slice(0, 3);
      this.move = function (step) {
        first = (first + step + reviews.length) % reviews.length;
        this.visible = reviews.concat(reviews).slice(first, first + 3);
        this.announcement =
          "Primer testimonio visible: " + reviews[first].name + ".";
      };
    },
  });
})();
