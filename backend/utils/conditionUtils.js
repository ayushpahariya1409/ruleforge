// const crypto = require('crypto');

// /**
//  * Normalize a condition tree with:
//  * - Case normalization (lowercase strings, UPPERCASE logic)
//  * - Trimming whitespace
//  * - Flattening nested groups with same logic (AND(A, AND(B, C)) → AND(A, B, C))
//  * - Deterministic sorting for order-independence
//  *
//  * @param {Object} node - The condition node or group
//  * @param {string} parentLogic - Parent's logic for flattening (internal use)
//  * @returns {Object} Normalized condition tree
//  */
// function normalizeCondition(node, parentLogic = null) {
//     if (!node) return node;

//     // ✅ LEAF NODE (field/operator/value)
//     if (node.field && node.operator) {
//         return {
//             field: String(node.field).trim().toLowerCase(),
//             operator: String(node.operator).trim().toLowerCase(),
//             value:
//                 typeof node.value === 'string'
//                     ? node.value.trim().toLowerCase()
//                     : node.value,
//         };
//     }

//     // ✅ GROUP NODE (logic + conditions array)
//     const logic = String(node.logic || 'AND').toUpperCase();
//     let conditions = (node.conditions || []).map((cond) =>
//         normalizeCondition(cond, logic)
//     );

//     conditions = flattenConditions(conditions, logic);

  
//     conditions.sort((a, b) =>
//         JSON.stringify(a).localeCompare(JSON.stringify(b))
//     );

//     return {
//         logic,
//         conditions,
//     };
// }

// /**
//  * Flatten conditions: if a child is a group with same logic,
//  * merge its conditions into the parent array
//  *
//  * @param {Array} conditions - Array of normalized conditions
//  * @param {string} parentLogic - The parent's logic (AND/OR)
//  * @returns {Array} Flattened conditions
//  */
// function flattenConditions(conditions, parentLogic) {
//     return conditions.reduce((acc, cond) => {
//         // If this is a group with the same logic as parent, merge its children
//         if (
//             cond.logic &&
//             cond.logic === parentLogic &&
//             cond.conditions &&
//             Array.isArray(cond.conditions)
//         ) {
//             acc.push(...cond.conditions);
//         } else {
//             acc.push(cond);
//         }
//         return acc;
//     }, []);
// }

// /**
//  * Convert normalized condition to a deterministic JSON string
//  *
//  * @param {Object} condition - The condition tree (should be pre-normalized)
//  * @returns {string} JSON string of normalized condition
//  */
// function stringifyCondition(condition) {
//     return JSON.stringify(normalizeCondition(condition));
// }

// /**
//  * Generate a SHA256 hash of the normalized condition tree
//  * This hash serves as a unique identifier for logically identical rules
//  *
//  * @param {Object} condition - The condition tree
//  * @returns {string} SHA256 hash (hex string)
//  */
// function getConditionHash(condition) {
//     const normalized = normalizeCondition(condition);
//     const stringified = JSON.stringify(normalized);
//     return crypto
//         .createHash('sha256')
//         .update(stringified)
//         .digest('hex');
// }

// module.exports = {
//     normalizeCondition,
//     flattenConditions,
//     stringifyCondition,
//     getConditionHash,
// };



const crypto = require('crypto');

/**
 * Normalize a condition tree
 */
function normalizeCondition(node, parentLogic = null) {
    if (!node) return node;

    // LEAF
    if (node.field && node.operator) {
        return {
            field: String(node.field).trim().toLowerCase(),
            operator: String(node.operator).trim().toLowerCase(),
            value:
                typeof node.value === 'string'
                    ? node.value.trim().toLowerCase()
                    : node.value,
        };
    }

    // GROUP
    const logic = String(node.logic || 'AND').toUpperCase();

    let conditions = (node.conditions || []).map((cond) =>
        normalizeCondition(cond, logic)
    );

    conditions = flattenConditions(conditions, logic);

    conditions.sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
    );

    return {
        logic,
        conditions,
    };
}

/**
 * Flatten same-logic groups
 */
function flattenConditions(conditions, parentLogic) {
    return conditions.reduce((acc, cond) => {
        if (
            cond.logic &&
            cond.logic === parentLogic &&
            Array.isArray(cond.conditions)
        ) {
            acc.push(...cond.conditions);
        } else {
            acc.push(cond);
        }
        return acc;
    }, []);
}

/**
 * HASH
 */
function getConditionHash(condition) {
    const normalized = normalizeCondition(condition);

    return crypto
        .createHash('sha256')
        .update(JSON.stringify(normalized))
        .digest('hex');
}

/**

 * SHORT-CIRCUIT EVALUATION ENGINE (NEW)

 *
 * sampleData = { orderTotal: 18 }
 */
function evaluateCondition(node, sampleData, depth = 0) {
    const indent = '  '.repeat(depth);

    node = normalizeCondition(node);

    // LEAF evaluation
    if (node.field && node.operator) {
        const left = sampleData[node.field];
        const right = node.value;

        let result = false;

        switch (node.operator) {
            case '=':
                result = left == right;
                break;
            case '!=':
                result = left != right;
                break;
            case '<':
                result = left < right;
                break;
            case '<=':
                result = left <= right;
                break;
            case '>':
                result = left > right;
                break;
            case '>=':
                result = left >= right;
                break;
        }

        console.log(
            `${indent}LEAF: ${node.field} ${node.operator} ${node.value} => ${result}`
        );

        return result;
    }

    // GROUP evaluation
    const logic = node.logic || 'AND';

    console.log(`${indent}GROUP (${logic}) START`);

    if (logic === 'AND') {
        for (let i = 0; i < node.conditions.length; i++) {
            const cond = node.conditions[i];

            const result = evaluateCondition(cond, sampleData, depth + 1);

            if (!result) {
                console.log(
                    `${indent}GROUP (AND) SHORT-CIRCUIT  at index ${i}`
                );
                return false;
            }
        }

        console.log(`${indent}GROUP (AND) PASS `);
        return true;
    }

    if (logic === 'OR') {
        for (let i = 0; i < node.conditions.length; i++) {
            const cond = node.conditions[i];

            const result = evaluateCondition(cond, sampleData, depth + 1);

            if (result) {
                console.log(
                    `${indent}GROUP (OR) SHORT-CIRCUIT  at index ${i}`
                );
                return true;
            }
        }

        console.log(`${indent}GROUP (OR) FAIL ❌`);
        return false;
    }

    return false;
}

/**
 * Debug helper
 */
function stringifyCondition(condition) {
    return JSON.stringify(normalizeCondition(condition));
}

module.exports = {
    normalizeCondition,
    getConditionHash,
    stringifyCondition,
    evaluateCondition,
};