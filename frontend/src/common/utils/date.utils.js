(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .factory("dateUtils", [
      function DateUtils() {
        const monthNames = [
          "ene", "feb", "mar", "abr", "may", "jun",
          "jul", "ago", "sep", "oct", "nov", "dic",
        ];
        const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
        const clinicDate = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Mexico_City",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        });

        return {
          buildAvailableDates: function () {
            const dates = [];
            const parts = Object.fromEntries(
              clinicDate.formatToParts(new Date()).map((part) => [part.type, part.value]),
            );
            const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));

            for (let offset = 1; offset <= 7; offset += 1) {
              const date = new Date(today);
              date.setUTCDate(date.getUTCDate() + offset);
              const day = date.getUTCDate();
              const month = monthNames[date.getUTCMonth()];
              const weekday = dayNames[date.getUTCDay()];
              dates.push({
                value: date.toISOString().slice(0, 10),
                day: weekday,
                dayNumber: String(day),
                month: month,
                label: weekday + " " + day + " de " + month,
              });
            }

            return dates;
          },
          formatTime: function (time) {
            const parts = time.split(":");
            let hour = Number(parts[0]);
            const minute = parts[1];
            const period = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return { value: time, label: hour + ":" + minute + " " + period };
          },
        };
      },
    ]);
})();
