import AbstractField from '@js/Search/Query/Field/AbstractField';

export default class FieldEquals extends AbstractField {

    /**
     * @inheritDoc
     */
    evaluate(item) {
        let values = this._getFieldValues(item);

        if(!values) return {passed: false};

        let search = this._value;
        if(typeof search === 'string' && this._name !== 'password') {
            search = this._value.toLowerCase();
        }
        for(let value of values) {
            if(value === search) return  {matches: 1, checks: 1, passed: true};
        }

        return {passed: false};
    }
}