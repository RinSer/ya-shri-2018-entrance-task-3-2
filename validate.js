var helpers = require('./helpers.js');

// Валидаторы вводимых и выводимых данных

module.exports = {
    /**
     * Валидация устройств: у каждого 
     * вводимого устройства должны быть 
     * идентификатор, мощность 
     * и продолжительность цикла;
     * Проверка логичности продолжительности работы
     * @param {*} device 
     */
    validateDevice: function(device, maxPower) {
        if (!device.id || typeof device.id !== 'string')
            return false;
        if (!device.power || typeof device.power !== 'number' || device.power > maxPower)
            return false;
        if (!device.duration || typeof device.duration !== 'number' || device.duration > 24)
            return false;
        if (device.mode && device.mode === 'night' && device.duration > 10)
            return false;
        if (device.mode && device.mode === 'day' && device.duration > 14)
            return false;
        return true;
    },

    /**
     * Проверяем тарифы: временные интервалы в тарифной сетке 
     * не должны пересекаться и их сумма должна покрывать сутки
     * @param {*} rates 
     */
    validateRates: function(rates) {
        // Сортируем по времени начала по возрастанию
        rates = rates.sort((a, b) => {
            if (a.from < b.from)
                return -1;
            if (b.from < a.from)
                return 1;
            return 0;
        });
        // Проверяем, что временные интервалы не пересекаются
        for (var i = 0; i < rates.length - 1; i++)
            if (rates[i].to > rates[i+1].from)
                return false;
        // Проверяем, что сумма времени равна 24
        return rates.reduce((a, r) => {
            var d = r.to - r.from;
            if (d < 0) d += 24;
            return a + d;
        }, 0) === 24;
    },

    /**
     * Простая проверка на состоятельность:
     * если суммарная потребляемая мощность 
     * приборов за сутки превышает максимально
     * возможную мощность, помноженную на 24, 
     * то данный список устройств должен 
     * считаться несостоятельным, так как 
     * мы не можем дать каждому устройству
     * отработать полный цикл
     */
    validateConsistancy: function(devices, maxPower) {
        if (helpers.maxConsumption(devices) > maxPower * 24)
            return false;
        var atDevicesConsumption = helpers.maxConsumptionPerHour(devices.filter(d => d.duration === 24));
        var dayDevicesConsumption = helpers.maxConsumption(devices.filter(d => d.mode && d.mode === 'day'));
        if (atDevicesConsumption * 14 + dayDevicesConsumption > maxPower * 14)
            return false;
        var nightDevicesConsumption = helpers.maxConsumption(devices.filter(d => d.mode && d.mode === 'night'));
        if (atDevicesConsumption * 10 + nightDevicesConsumption > maxPower * 10)
            return false;

        return true;
    },

    /**
     * Подтверждаем, что в расписании каждое устройство 
     * отрабатывает свой цикл полностью и нагрузка 
     * никогда не была превышена
     * @param {*} schedule 
     * @param {*} devices 
     */
    validateOutput: function(schedule, devices, maxPower) {
        // Все устройства отработали полный цикл
        for (var device of devices) {
            var time = 0;
            for (var i = 0; i < 24; i++)
                if (schedule[i].indexOf(device.id) > -1)
                    time += 1;
            if (time !== device.duration) {
                return false;
            }
        }
        // Нагрузка в каждом часе не превышет максимальной
        for (var i = 0; i < 24; i++) {
            if (schedule[i].reduce((a, id) => {
                var device = devices.find(dev => dev.id === id);
                return a + device.power;
            }, 0) > maxPower) {
                return false;
            }
        }
        return true;
    }
}