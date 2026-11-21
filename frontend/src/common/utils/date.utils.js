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

        return {
          buildAvailableDates: function () {
            const dates = [];
            const today = new Date();

            for (let offset = 1; offset <= 7; offset += 1) {
              const date = new Date(today);
              date.setDate(today.getDate() + offset);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              dates.push({
                value: year + "-" + month + "-" + day,
                day: dayNames[date.getDay()],
                dayNumber: String(date.getDate()),
                month: monthNames[date.getMonth()],
                label:
                  dayNames[date.getDay()] +
                  " " +
                  date.getDate() +
                  " de " +
                  monthNames[date.getMonth()],
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
