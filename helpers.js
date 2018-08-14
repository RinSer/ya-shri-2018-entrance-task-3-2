// Вспомогательные функции

module.exports = {
    /**
     * Суммарное потребление энергии для всех устройств в списке
     * @param {*} devices 
     */
    maxConsumption: function(devices) {
        return devices.reduce((acc, device) => {
            return acc + device.power * device.duration;
        }, 0);
    },

    /**
     * Суммарное потребление энергии для всех устройств в списке за час
     * @param {*} devices 
     */
    maxConsumptionPerHour: function(devices) {
        return devices.reduce((acc, d) => acc + d.power, 0);
    },

    /**
     * Находит начало и конец времени работы
     */
    findStartStop: function(mode) {
        const NIGHT_START = 21;
        const DAY_START = 7;

        var period = null;
        if (mode) {
            if (mode === 'day')
                period = { from: DAY_START, to: NIGHT_START };
            if (mode === 'night')
                period = { from: NIGHT_START, to: DAY_START };
        }
        var start, stop;
        if (period) {
            stop = period.to;
            if (period.from < period.to) 
                start = period.from
            else start = period.from - 24;
        } else {
            start = 0;
            stop = 24;
        }

        return { from: start, to: stop };
    },

    /**
     * Минимизация стоимости электроэнергии для получившегося расписания
     * @param {*} schedule 
     * @param {*} devices 
     * @param {*} rates 
     * @param {*} maxPower 
     */
    optimizeSchedule: function(schedule, devices, rates, maxPower) {
        for (var device of devices.filter(d => d.duration !== 24)) {
            var interval = module.exports.findStartStop(device.mode);
            var start = interval.from;
            var stop = interval.to;
            var scheduleHour;
            for (var s = start; s < stop; s++) {
                var hour = s;
                if (hour < 0) hour += 24;
                if (schedule[hour].indexOf(device.id) > -1) {
                    scheduleHour = hour;
                    s = stop;
                }
            }
            var minHour = {
                hour: scheduleHour,
                value: 0
            };
            for (var i = minHour.hour; i < minHour.hour + device.duration; i++) {
                var hour = i;
                if (hour > 23) hour = hour % 24;
                minHour.value += findHourRate(hour, rates).value;
            }
            var optimalHour = {
                hour: minHour.hour,
                value: minHour.value
            };
            for (var h = start; h < stop - device.duration; h++) {
                var currentHour = h;
                if (currentHour < 0) currentHour += 24;
                var fit = true;
                for (var d = 0; d < device.duration; d++) {
                    var hour = currentHour + d; 
                    if (hour > 23) hour = hour % 24;
                    if (module.exports.maxConsumptionPerHour(devices.filter(dev => dev.id !== device.id && schedule[hour].indexOf(dev.id) > -1)) + device.power > maxPower)
                        fit = false;
                }
                if (fit) {
                    var currentValue = 0;
                    for (var i = currentHour; i < currentHour + device.duration; i++) {
                        var hour = i;
                        if (hour > 23) hour = hour % 24;
                        currentValue += findHourRate(hour, rates).value;
                    }
                    if (currentValue < optimalHour.value) {
                        optimalHour.hour = currentHour;
                        optimalHour.value = currentValue;
                    }
                }
            }
            if (optimalHour.hour !== minHour.hour) {
                // Удаляем субоптимальные записи
                for (var i = minHour.hour; i < minHour.hour + device.duration; i++) {
                    var hour = i;
                    if (hour > 23) hour = hour % 24;
                    var idx = schedule[hour].indexOf(device.id);
                    schedule[hour].splice(idx, 1);
                }
                // Добавляем оптимальные
                for (var i = optimalHour.hour; i < optimalHour.hour + device.duration; i++) {
                    var hour = i; 
                    if (hour > 23) hour = hour % 24;
                    schedule[hour].push(device.id);
                }
            }
        }
    },

    /**
     * Подсчитывает общую стоимость потребленной энергии 
     * и стоимость потребленной энергии для каждого устройства
     * @param {*} schedule 
     * @param {*} rates 
     * @param {*} devices 
     */
    computeConsumedEnergy: function(schedule, rates, devices) {
        var devIds = {};
        for (var device of devices)
            devIds[device.id] = 0;
        var totalValue = 0;
        for (var i = 0; i < 24; i++) {
            var rate = findHourRate(i, rates);
            for (var device of devices)
                if (schedule[i].indexOf(device.id) > -1) {
                    var deviceConsumption = (rate.value * device.power) / 1000;
                    devIds[device.id] += deviceConsumption;
                    devIds[device.id] = roundFloat(devIds[device.id]);
                    totalValue += deviceConsumption;
                    totalValue = roundFloat(totalValue);
                }
        }
        var consumedEnergy = {};
        consumedEnergy.value = totalValue;
        consumedEnergy.devices = devIds;
        
        return consumedEnergy;
    }

}

/**
 * Находит тариф для часа суток
 * @param {*} hour 
 * @param {*} rates 
 */
function findHourRate(hour, rates) {
    if (rates.length > 0 && hour > -1 && hour < 24) {
        return rates.find(r => {
            if (r.from < r.to)
                return hour >= r.from && hour < r.to;
            else
                return hour >= r.from || hour < r.to;
        });
    }
}

/**
 * Округление до четырех знаков после запятой
 * @param {*} float 
 */
function roundFloat(float) {
    return parseFloat(float.toFixed(4));
}