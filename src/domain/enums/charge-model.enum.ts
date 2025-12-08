// if its metered, then we need to specify the charge model for the feature
export enum ChargeModel {
    PER_USER = 'per_user',
    PER_USAGE = 'per_usage',
    TIERED = 'tiered',
    VOLUME = 'volume',
    GRADUATED = 'graduated',
}
