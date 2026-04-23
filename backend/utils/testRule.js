const { evaluateCondition } = require('./conditionUtils');
// adjust path if your file name differs

// const rule = {
//     logic: "AND",
//     conditions: [
//         {
//             field: "orderTotal",
//             operator: "=",
//             value: 18
//         },
//         {
//             field: "orderTotal",
//             operator: "=",
//             value: 20
//         },
//         {
//             field: "orderTotal",
//             operator: ">",
//             value: 10
//         }
//     ]
// };


const rule = {
    logic: "AND",
    conditions: [
        { field: "userIsPremium", operator: "=", value: true },

        {
            logic: "OR",
            conditions: [
                {
                    logic: "AND",
                    conditions: [
                        { field: "orderTotal", operator: ">", value: 500 },
                        { field: "orderQuantity", operator: ">=", value: 3 },

                        {
                            logic: "OR",
                            conditions: [
                                { field: "productCategory", operator: "=", value: "Electronics" },
                                { field: "productPrice", operator: ">", value: 200 }
                            ]
                        }
                    ]
                },

                { field: "productIsDigital", operator: "=", value: false }
            ]
        }
    ]
}

const sampleData = {
    orderTotal: 18
};

console.log("===== START TEST =====");

const result = evaluateCondition(rule, sampleData);

console.log("===== FINAL RESULT =====");
console.log(result);