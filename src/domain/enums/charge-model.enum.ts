// if its metered, then we need to specify the charge model for the feature
export enum ChargeModel {
    PER_SEAT = 'per_seat',
    PER_API_CALL = 'per_api_call',
    TIERED = 'tiered',
    PACKAGE = 'package',
    VOLUME = 'volume',
    GRADUATED = 'graduated',
}
