// Contain all flags for better readability and easily modify

// User flag that mostly used for spell differentiations
export const enum FLAG_USER {

    NONE,
    EVASION, // THE DAMAGE IS EVADED
    CRITICAL, // THE DAMAGE IS CRITICAL
    HEAL, // THE DAMAGE IS HEAL
    SHIELD // THE DAMAGE IS NEGATED BY SHIELD
}

// Engine flag that used to indicate damage type and maybe source type
export const enum FLAG_ENGINE {
    NONE,
    PHYSICAL, // IS A PHYSICAL DAMAGE
    MAGICAL, // IS A MAGICAL DAMAGE
    TRUE_DAMAGE, // IS A DAMAGE THAT IGNORE ARMOR
    ATTACK, // IS A AUTO-ATTACK DAMAGE (SAME AS BASIC FROM INTERNAL)
    ACTIVE_SPELL,// IS A ACTIVE SPELL DAMAGE
    AOE, // IS A AOE DAMAGE
    PERIODIC, // IS A DAMAGE OVER TIMES
    ITEM // IS IT A DAMAGE FROM ITEM
}

// Internal flag that used by the engine to differentiate the unique flag of the damage
export const enum FLAG_INTERNAL {
    RAW, // IGNORE ALL MODIFICATION NOT FROM THE ENGINE IT SELF
    INTERNAL, // DIRECTLY SUBSTRACT TARGET HEALTH
    DEFAULT, // DOES NOTHING
    PROC, // FLAG THE DAMAGE WHETHER IS PROC OF AN ITEM
    REACTIVE, // FLAG THE DAMAGE WHETHER IS A REFLECTIVE DAMAGE FROM AN ITEM
    BASIC, // BASIC ATTACK
    SPELL, // IS SPELL
    AREA, // IS AREA DAMAGE
    PERSISTANCE,  // IS DAMAGE OVER TIMES
    PET, // NOT COMING FROM HERO BUT SUMMONED UNIT
}