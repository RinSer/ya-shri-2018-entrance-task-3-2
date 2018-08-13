var valid = require('./validate');

module.exports = {
    /**
     * Получение и изменение первоначальных данных
     * @param {*} mode 
     */
    getData: function(mode) {
        var inputFilePath = './data/input.json';
        // Если указан путь к файлу с исходными данными
        if (process.argv[2])
            inputFilePath = process.argv[2];
        var initialData = Object.assign({}, require(inputFilePath));
        if (mode && mode.name && mode.name === 'many') {
            var moreDevices = [];
            var devicesToAdd = initialData.devices.filter(d => d.duration !== 24);
            var id = 1;
            while (valid.validateConsistancy(initialData.devices.concat(moreDevices), 2100)) {
                let randIdx = Math.floor(Math.random() * Math.floor(devicesToAdd.length));
                var newDevice = Object.assign({}, devicesToAdd[randIdx]);
                newDevice.id = `${id}`;
                moreDevices.push(newDevice);
                id++;
            }
            if (!mode.break)
                moreDevices.splice(moreDevices.length - 1, 1);
            initialData.devices = initialData.devices.concat(moreDevices);
        }
        return initialData;
    }
}