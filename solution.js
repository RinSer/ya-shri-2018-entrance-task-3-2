var data =  require('./data');
var valid = require('./validate');
var helpers = require('./helpers');

module.exports = {
    /**
     * Основная функция, преобразующая данные
     * @param {*} initial 
     */
    processData: function(initial) {
        const MAX_POWER = initial.maxPower;

        let rates = initial.rates;
        if (!valid.validateRates(rates)) {
            console.log('Исправьте сетку тарифов!');
            throw "InputValidationError";
        }
        let devices = initial.devices.filter(d => valid.validateDevice(d));
        if (!valid.validateConsistancy(devices, MAX_POWER)) {
            console.log('Невозможно запустить каждое устройство в течении суток!');
            throw "InputValidationError";
        }
        // Создаём расписание устройств
        // и добавляем все устройства, которые должны работать
        // круглосуточно к каждому часу в расписании
        var atclocks = devices.filter(d => d.duration === 24);
        var schedule = {};
        for (var i = 0; i < 24; i++)
            schedule[i] = atclocks.map(a => a.id);
        // Добавляем остальные устройства, 
        // в приоритете те, у которых указано время дня
        var anytimes = devices.filter(d => d.duration !== 24).sort((a, b) => {
            if (a.mode && b.mode || !a.mode && !b.mode)
                return 0;
            if (a.mode && !b.mode)
                return -1;
            if (!a.mode && b.mode);
                return 1;
        });
        for (var device of anytimes) {
            var interval = helpers.findStartStop(device.mode);
            var start = interval.from;
            var stop = interval.to;
            // Находим субоптимальное решение, чтобы добавить
            // в расписание максимально возможное количетво устройств
            for (var h = start; h < stop; h++) {
                if (device.mode) {
                    // Выводим информацию об устройстве, которое не получается
                    // включить в расписание, не нарушив ограничения по мощности
                    if (h + device.duration > stop) {
                        console.log(`Не получается добавить в расписание устройство:`);
                        console.log(device);
                        /*console.log(`Текущее расписание:`);
                        for (var i = 0; i < 24; i++) {
                            console.log(`${i}:`);
                            console.log(schedule[i].map(id => devices.find(d => d.id === id)));
                        }*/
                        throw "DataConsistancyError";
                    }
                }
                var currentHour = h;
                if (currentHour < 0) currentHour += 24;
                var fit = true;
                for (var d = 0; d < device.duration; d++) {
                    var hour = currentHour + d; 
                    if (hour > 23) hour = hour % 24;
                    if (helpers.maxConsumptionPerHour(devices.filter(dev => schedule[hour].indexOf(dev.id) > -1)) + device.power > MAX_POWER)
                        fit = false;
                }
                if (fit) {
                    for (var t = currentHour; t < currentHour + device.duration; t++) {
                        var hour = t; 
                        if (hour > 23) hour = hour % 24;
                        schedule[hour].push(device.id);
                    }
                    h = stop;
                }
            }
        }
        // Оптимизируем первоначальное расписание, если это возможно
        helpers.optimizeSchedule(schedule, devices, rates, MAX_POWER);
        
        if (!valid.validateOutput(schedule, devices, MAX_POWER)) {
            console.log('В получившемся расписании не все устройства отработают полный цикл!');
            throw "OutputValidationError";
        }
        
        var consumedEnergy = helpers.computeConsumedEnergy(schedule, rates, devices);
        
        var result = JSON.stringify({ schedule: schedule, consumedEnergy: consumedEnergy });

        // Записываем результат в файл, путь к которому указан при вызове
        if (process.argv[3]) {
            var fs = require('fs');
            fs.writeFile(process.argv[3], result, 'utf8', err => console.log(err));
        }

        return result;
    }
}

// Execution
var main = module.exports.processData;
console.log(main(data.getData()));
