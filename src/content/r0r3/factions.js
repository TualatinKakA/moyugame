export default [
  {
    "id": "fairy",
    "sourceName": "Fairy",
    "name": "产品部",
    "alignment": "good",
    "spell": "fairyChanting",
    "spellName": "头脑风暴",
    "upgrades": [
      {
        "id": "fairy-0",
        "sourceName": "Fairies Trade Treaty",
        "code": "FR0",
        "tier": 1,
        "kind": "treaty",
        "cost": 0.0,
        "costText": "Free at R0 with 0 gems, 20 Fairy Coins afterwards.",
        "currency": "fairy",
        "effects": [
          "Fairies focus on the small and common things and make them magically powerful. Affiliating yourself with the Fairy faction will hugely improve the output of lower tier buildings."
        ],
        "formulas": []
      },
      {
        "id": "fairy-1",
        "sourceName": "Pixie Dust Fertilizer",
        "code": "FR1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "Increase the base production of Farms by +98.",
          "Reduces cost multiplier by 0.02; with no other reductions applying, the multiplier will be 1.13 instead of 1.15."
        ],
        "formulas": []
      },
      {
        "id": "fairy-2",
        "sourceName": "Fairy Workers",
        "code": "FR2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "Increase the production of Farms, Inns and Blacksmiths by 10,000%."
        ],
        "formulas": []
      },
      {
        "id": "fairy-3",
        "sourceName": "Kind Hearts",
        "code": "FR3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Increases maximum Mana additively based on Good buildings you own."
        ],
        "formulas": [
          "+(1.3 * x ^ 0.7), where x is the amount of Good buildings you own."
        ]
      },
      {
        "id": "fairy-4",
        "sourceName": "Fairies Friendship Pact",
        "code": "FR4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Fairy Coins",
        "currency": "fairy",
        "effects": [
          "Unlocks more Fairy Upgrades"
        ],
        "formulas": []
      },
      {
        "id": "fairy-5",
        "sourceName": "Fairy Cuisine",
        "code": "FR5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Increase the base production of Inns by +234 and reduce the building cost multiplier.",
          "Reduces cost multiplier by 0.02; with no other reductions applying, the multiplier will be 1.13 instead of 1.15."
        ],
        "formulas": []
      },
      {
        "id": "fairy-6",
        "sourceName": "Golden Pots",
        "code": "FR6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Additively increase base clicking reward by 20% of the building production of Farms, Inns and Blacksmiths combined."
        ],
        "formulas": []
      },
      {
        "id": "fairy-7",
        "sourceName": "Spellsmith",
        "code": "FR7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Blacksmiths also increase your Mana Regeneration."
        ],
        "formulas": [
          "+(2.75 * x ^ 0.275), where x is the number of Blacksmiths you own."
        ]
      },
      {
        "id": "fairy-8",
        "sourceName": "Fairies Alliance",
        "code": "FR8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Fairy Coins",
        "currency": "fairy",
        "effects": [
          "Unlocks more Fairy upgrades."
        ],
        "formulas": []
      },
      {
        "id": "fairy-9",
        "sourceName": "Starmetal Alloys",
        "code": "FR9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Increase the base production of Blacksmiths by +580.",
          "Reduces cost multiplier by 0.02; with no other reductions applying, the multiplier will be 1.13 instead of 1.15."
        ],
        "formulas": []
      },
      {
        "id": "fairy-10",
        "sourceName": "Rainbow Link",
        "code": "FR10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of Farms, Inns and Blacksmiths you own."
        ],
        "formulas": [
          "(0.75 * x ^ 0.75)%, where x is the amount of Farms, Inns and Blacksmiths you own."
        ]
      },
      {
        "id": "fairy-11",
        "sourceName": "Swarm of Fairies",
        "code": "FR11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "You gain additional assistants based on the amount of Farms, Inns and Blacksmiths you own."
        ],
        "formulas": [
          "+(1.2 * x ^ 0.6), where x is the number of Farms, Inns, and Blacksmiths you own."
        ]
      },
      {
        "id": "fairy-12",
        "sourceName": "Fairy Heritage",
        "code": "FR12",
        "tier": 3,
        "kind": "heritage",
        "cost": 5000.0,
        "costText": "5,000 Fairy Coins",
        "currency": "fairy",
        "effects": [
          "Increase the production of all buildings by 0.075% per Farm, Inn and Blacksmith you own."
        ],
        "formulas": []
      }
    ]
  },
  {
    "id": "elf",
    "sourceName": "Elf",
    "name": "技术部",
    "alignment": "good",
    "spell": "moonBlessing",
    "spellName": "月光迭代",
    "upgrades": [
      {
        "id": "elf-0",
        "sourceName": "Elven Trade Treaty",
        "code": "EL0",
        "tier": 1,
        "kind": "treaty",
        "cost": 20.0,
        "costText": "20 Elven Coins",
        "currency": "elven",
        "effects": [
          "Unlocks Elven Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "elf-1",
        "sourceName": "Elven Mint",
        "code": "EL1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "The base chance to find Faction Coins is increased by a multiplicative 150%."
        ],
        "formulas": []
      },
      {
        "id": "elf-2",
        "sourceName": "Elven Treasure Casing",
        "code": "EL2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "Increase base clicking reward by +25,000 per Trophy unlocked, and increase chance to find Faction Coins based on the amount of Trophies you unlocked."
        ],
        "formulas": [
          "+((1 + 0.1 * x) ^ 0.95)%, where x is the amount of Trophies unlocked."
        ]
      },
      {
        "id": "elf-3",
        "sourceName": "Ancient Clicking Arts",
        "code": "EL3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration based on the amount of clicks made in this Reincarnation."
        ],
        "formulas": [
          "+(2 * log10(1 + x) ^ 1.25), where x is the amount of clicks made in this Reincarnation."
        ]
      },
      {
        "id": "elf-4",
        "sourceName": "Elven Friendship Pact",
        "code": "EL4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Elven Coins",
        "currency": "elven",
        "effects": [
          "Unlocks more Elven Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "elf-5",
        "sourceName": "Elven Emissary",
        "code": "EL5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Increase clicking reward based on the amount of Good buildings you own, and assistants find 3 times as many Faction Coins."
        ],
        "formulas": [
          "(x ^ 0.6)%, where x is the number of Good Buildings you own."
        ]
      },
      {
        "id": "elf-6",
        "sourceName": "Elven Efficiency",
        "code": "EL6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Increase Royal Exchange bonus based on Faction Coins found this game."
        ],
        "formulas": [
          "+(2 * ln(1 + x) ^ 2)%, where x is Faction Coins found this game."
        ]
      },
      {
        "id": "elf-7",
        "sourceName": "Secret Clicking Techniques",
        "code": "EL7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of clicks made in this Reincarnation."
        ],
        "formulas": [
          "(2 * x ^ 0.4)%, where x is the amount of clicks made in this Reincarnation."
        ]
      },
      {
        "id": "elf-8",
        "sourceName": "Elven Alliance",
        "code": "EL8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Elven Coins",
        "currency": "elven",
        "effects": [
          "Unlocks more Elven Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "elf-9",
        "sourceName": "Elven Diplomacy",
        "code": "EL9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Clicks count more based on Faction Coins found this game."
        ],
        "formulas": [
          "(2 * ln(1 + x) ^ 2)%, where x is Faction Coins found this game."
        ]
      },
      {
        "id": "elf-10",
        "sourceName": "Elven Luck",
        "code": "EL10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "Each time you click for money you have 1% chance to gain coins equal to 250000% of your production, also generating Faction Coins based on Reincarnation made.",
          "Assistants have the same chance to trigger Elven Luck once every second. Elven Lucks triggered this way have their coin reward multiplied by the amount of assistants you have."
        ],
        "formulas": [
          "(2500 * (x + y)), where x is the production of all buildings, and y is the production of one assistant.",
          "(x * (R + 1)) of a random type, where x is Faction Coin chance and R is the number of times you have reincarnated."
        ]
      },
      {
        "id": "elf-11",
        "sourceName": "Sylvan Treasure Frills",
        "code": "EL11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "Additively increase base clicking reward by 50% of your building production."
        ],
        "formulas": []
      },
      {
        "id": "elf-12",
        "sourceName": "Elven Heritage",
        "code": "EL12",
        "tier": 3,
        "kind": "heritage",
        "cost": 5000.0,
        "costText": "5000 Elven Coins",
        "currency": "elven",
        "effects": [
          "Increase your chance to find Faction Coins by 5% and increase your Click reward based on your chance to find Faction Coins."
        ],
        "formulas": [
          "(2 * ln(1 + x) ^ 2)%, where x is your Faction Coin find chance."
        ]
      }
    ]
  },
  {
    "id": "angel",
    "sourceName": "Angel",
    "name": "战略部",
    "alignment": "good",
    "spell": "godsHand",
    "spellName": "全员动员",
    "upgrades": [
      {
        "id": "angel-0",
        "sourceName": "Angels Trade Treaty",
        "code": "AN0",
        "tier": 1,
        "kind": "treaty",
        "cost": 20.0,
        "costText": "20 Angel Coins",
        "currency": "angel",
        "effects": [
          "Unlocks Angel Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "angel-1",
        "sourceName": "Holy Bells",
        "code": "AN1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration based on the amount of buildings you own."
        ],
        "formulas": [
          "+(1.6 * x ^ 0.4), where x is the amount of buildings you own."
        ]
      },
      {
        "id": "angel-2",
        "sourceName": "Angelic Determination",
        "code": "AN2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on spells cast this game.",
          "Also increase Angel Coins found (from all sources) by 500%."
        ],
        "formulas": [
          "(4 * ln(1 + x) ^ 2)%, where x is spells cast this game."
        ]
      },
      {
        "id": "angel-3",
        "sourceName": "Angel Feathers",
        "code": "AN3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance additively based on the amount of active spells."
        ],
        "formulas": [
          "+(10 * x)%, where x is the amount of active spells."
        ]
      },
      {
        "id": "angel-4",
        "sourceName": "Angels Friendship Pact",
        "code": "AN4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Angel Coins",
        "currency": "angel",
        "effects": [
          "Unlocks more Angel Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "angel-5",
        "sourceName": "Guardian Angels",
        "code": "AN5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Spell casts count 100% more."
        ],
        "formulas": []
      },
      {
        "id": "angel-6",
        "sourceName": "Angelic Wisdom",
        "code": "AN6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Decrease the cost of all spells by 50%.",
          "Also increases offline spell cast amount by multiplicatively based on your offline Mana Regeneration."
        ],
        "formulas": [
          "(10 * log10(1 + x))%, where x is your offline Mana Regeneration."
        ]
      },
      {
        "id": "angel-7",
        "sourceName": "Archangel Feathers",
        "code": "AN7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration multiplicatively by 50%."
        ],
        "formulas": []
      },
      {
        "id": "angel-8",
        "sourceName": "Angels Alliance",
        "code": "AN8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Angel Coins",
        "currency": "angel",
        "effects": [
          "Unlocks more Angel Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "angel-9",
        "sourceName": "Magical Gates",
        "code": "AN9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Increase Maximum Mana based on time spent as Good in this Reincarnation."
        ],
        "formulas": [
          "+(3.5 * x ^ 0.7), where x is time spent as Good this Reincarnation."
        ]
      },
      {
        "id": "angel-10",
        "sourceName": "Angelic Dominance",
        "code": "AN10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "Spell durations are increased by 50%."
        ],
        "formulas": []
      },
      {
        "id": "angel-11",
        "sourceName": "Wings of Liberty",
        "code": "AN11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on Mana Regeneration."
        ],
        "formulas": [
          "(4 * ln(1 + x) ^ 2)%, where x is your Mana Regeneration."
        ]
      },
      {
        "id": "angel-12",
        "sourceName": "Angelic Heritage",
        "code": "AN12",
        "tier": 3,
        "kind": "heritage",
        "cost": 5000.0,
        "costText": "5000 Angel Coins",
        "currency": "angel",
        "effects": [
          "Multiplicatively increase Mana Regeneration by 10%."
        ],
        "formulas": []
      }
    ]
  },
  {
    "id": "goblin",
    "sourceName": "Goblin",
    "name": "财务部",
    "alignment": "evil",
    "spell": "goblinsGreed",
    "spellName": "预算腾挪",
    "upgrades": [
      {
        "id": "goblin-0",
        "sourceName": "Goblins Trade Treaty",
        "code": "GB0",
        "tier": 1,
        "kind": "treaty",
        "cost": 0.0,
        "costText": "Free at R0 with 0 gems, 20 Goblin Coins afterwards.",
        "currency": "goblin",
        "effects": [
          "Unlocks Goblin Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "goblin-1",
        "sourceName": "Strong Currency",
        "code": "GB1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "Gain assistants additively based on the amount of Faction Coins found in this game."
        ],
        "formulas": [
          "+(0.5 * ln(1 + x) ^ 2), where x is Faction Coins found this game."
        ]
      },
      {
        "id": "goblin-2",
        "sourceName": "Slave Trading",
        "code": "GB2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of Evil buildings you own."
        ],
        "formulas": [
          "(2 * x ^ 0.7)%, where x is the amount of Evil buildings you own"
        ]
      },
      {
        "id": "goblin-3",
        "sourceName": "Cheap Materials",
        "code": "GB3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Tax Collection is worth more seconds additively based on the amount of buildings you own."
        ],
        "formulas": [
          "+(x ^ 0.5), where x is the amount of buildings you own."
        ]
      },
      {
        "id": "goblin-4",
        "sourceName": "Goblins Friendship Pact",
        "code": "GB4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Goblin Coins",
        "currency": "goblin",
        "effects": [
          "Unlocks more Goblin Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "goblin-5",
        "sourceName": "Black Market",
        "code": "GB5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Production bonus from gems is increased by a multiplicative 150%.",
          "Also increase offline production bonus based on the amount of Tax Collections cast this game."
        ],
        "formulas": [
          "(log10(1 + x) ^ 2)%, where x is Tax Collection casts this game."
        ]
      },
      {
        "id": "goblin-6",
        "sourceName": "Goblin Economists",
        "code": "GB6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Mutiplicatively increase Mana Regeneration based on Gold owned."
        ],
        "formulas": [
          "((0.75 * log10(1 + x) ^ 1.25)%, where x is Gold owned."
        ]
      },
      {
        "id": "goblin-7",
        "sourceName": "Hobgoblin Gladiators",
        "code": "GB7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the worth in seconds of your Tax Collection spell."
        ],
        "formulas": [
          "(12 * ln(1 + x) ^ 3)%, where x is the seconds of your Tax Collection."
        ]
      },
      {
        "id": "goblin-8",
        "sourceName": "Goblins Alliance",
        "code": "GB8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Goblin Coins",
        "currency": "goblin",
        "effects": [
          "Unlocks more Goblin Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "goblin-9",
        "sourceName": "Goblin Central Bank",
        "code": "GB9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Whenever you cast a spell, also cast a Tax Collection for free."
        ],
        "formulas": []
      },
      {
        "id": "goblin-10",
        "sourceName": "Fool's Gold",
        "code": "GB10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance based on the highest amount of Witch Conclaves you own this Reincarnation."
        ],
        "formulas": [
          "floor(2 * x ^ 0.6)%, where x is the highest amount of Witch Conclaves you own this Reincarnation."
        ]
      },
      {
        "id": "goblin-11",
        "sourceName": "Green Fingers Discount",
        "code": "GB11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "Gain coins randomly every 10 minutes. Also works while being offline."
        ],
        "formulas": [
          "(randRange(1 , 2500) * x), where x is your total (buildings + assistants) coin production per second,"
        ]
      },
      {
        "id": "goblin-12",
        "sourceName": ": Goblin Champion Trophy",
        "code": "GB12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000.0,
        "costText": "5000 Goblin Coins",
        "currency": "goblin",
        "effects": [
          "Increase the production of all buildings based on the amount of Gems you own."
        ],
        "formulas": [
          "(floor(7.5 * log10(1 + x)))%, where x is the amount of Gems you own."
        ]
      }
    ]
  },
  {
    "id": "undead",
    "sourceName": "Undead",
    "name": "夜班部",
    "alignment": "evil",
    "spell": "nightTime",
    "spellName": "通宵赶工",
    "upgrades": [
      {
        "id": "undead-0",
        "sourceName": "Undead Trade Treaty",
        "code": "UD0",
        "tier": 1,
        "kind": "treaty",
        "cost": 20.0,
        "costText": "20 Undead Coins",
        "currency": "undead",
        "effects": [
          "Unlocks Undead upgrades."
        ],
        "formulas": []
      },
      {
        "id": "undead-1",
        "sourceName": "The Walking Dead",
        "code": "UD1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance additively based on assistants owned."
        ],
        "formulas": [
          "+(ln(1 + x) ^ 1.75)%, where x is assistants owned."
        ]
      },
      {
        "id": "undead-2",
        "sourceName": "Deadened Muscles",
        "code": "UD2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the highest amount of Necropolises you built in this Reincarnation."
        ],
        "formulas": [
          "(4 * x ^ 0.8)%, where x is the the highest amount of Necropolises you built in this Reincarnation."
        ]
      },
      {
        "id": "undead-3",
        "sourceName": "Death Temples",
        "code": "UD3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration additively based on the highest amount of Necropolises you built in this Reincarnation."
        ],
        "formulas": [
          "+(x ^ 0.3), where x is the highest amount of Necropolises you built in this Reincarnation."
        ]
      },
      {
        "id": "undead-4",
        "sourceName": "Undead Friendship Pact",
        "code": "UD4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Undead Coins",
        "currency": "undead",
        "effects": [
          "Unlocks more Undead upgrades."
        ],
        "formulas": []
      },
      {
        "id": "undead-5",
        "sourceName": "Unholy Rituals",
        "code": "UD5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Increase offline production based on time spent being offline in this Reincarnation."
        ],
        "formulas": [
          "(0.4 * x ^ 0.8)%, where x is your offline time this Reincarnation."
        ]
      },
      {
        "id": "undead-6",
        "sourceName": "Corpse Supply",
        "code": "UD6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Gain additional assistants based on time spent being offline in this Reincarnation."
        ],
        "formulas": [
          "+(0.4 * x ^ 0.6), where x is the time spent offline in this Reincarnation."
        ]
      },
      {
        "id": "undead-7",
        "sourceName": "Plagued Buildings",
        "code": "UD7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on time spent in this game."
        ],
        "formulas": [
          "((0.75 * x ^ 0.75)%, where x is time spent this game."
        ]
      },
      {
        "id": "undead-8",
        "sourceName": "Undead Alliance",
        "code": "UD8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Undead Coins",
        "currency": "undead",
        "effects": [
          "Unlocks more Undead upgrades."
        ],
        "formulas": []
      },
      {
        "id": "undead-9",
        "sourceName": "Dead Fields",
        "code": "UD9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Buildings count 75% more."
        ],
        "formulas": []
      },
      {
        "id": "undead-10",
        "sourceName": "Tireless Workers",
        "code": "UD10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "Increase the production of assistants by 1500%."
        ],
        "formulas": []
      },
      {
        "id": "undead-11",
        "sourceName": "Undead Resilience",
        "code": "UD11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "Increases offline production based on Mana Regeneration."
        ],
        "formulas": [
          "(125 * ln(1 + x) ^ 2.5)%, where x is your Mana Regeneration."
        ]
      },
      {
        "id": "undead-12",
        "sourceName": ": Undead Champion Trophy",
        "code": "UD12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000.0,
        "costText": "5000 Undead Coins",
        "currency": "undead",
        "effects": [
          "You gain additional assistants based on the time spent in this game."
        ],
        "formulas": [
          "+(floor(1 + 1.6 * (x / 3600) ^ 0.6)), where x is time spent this game."
        ]
      }
    ]
  },
  {
    "id": "demon",
    "sourceName": "Demon",
    "name": "运营部",
    "alignment": "evil",
    "spell": "hellfireBlast",
    "spellName": "高压执行",
    "upgrades": [
      {
        "id": "demon-0",
        "sourceName": "Demons Trade Treaty",
        "code": "DM0",
        "tier": 1,
        "kind": "treaty",
        "cost": 20.0,
        "costText": "20 Demon Coins",
        "currency": "demon",
        "effects": [
          "Unlocks Demon upgrades."
        ],
        "formulas": []
      },
      {
        "id": "demon-1",
        "sourceName": "Torture Chambers",
        "code": "DM1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 50000000.0,
        "costText": "50 M (5e7)",
        "currency": "coins",
        "effects": [
          "Increase the production of Royal Castles / Evil Fortresses / Iron Strongholds (based on your Alignment) based on the amount of assistants you own."
        ],
        "formulas": [
          "(6 * ln(1 + x) ^ 3)%, where x is the amount of assistants you own."
        ]
      },
      {
        "id": "demon-2",
        "sourceName": "Devil Tyrant",
        "code": "DM2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 500000000.0,
        "costText": "500 M (5e8)",
        "currency": "coins",
        "effects": [
          "The three highest building tiers count more based on time spent as Evil in this Reincarnation."
        ],
        "formulas": [
          "(1.2 * x ^ 0.4)%, where x is time spent as Evil this Reincarnation."
        ]
      },
      {
        "id": "demon-3",
        "sourceName": "Evil Conquerors",
        "code": "DM3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5000000000.0,
        "costText": "5 B (5e9)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the highest amount of Hell Portals you built in this Reincarnation."
        ],
        "formulas": [
          "(4 * x ^ 0.8)%, where x is the highest amount of Hell Portals you built in this Reincarnation."
        ]
      },
      {
        "id": "demon-4",
        "sourceName": "Demons Friendship Pact",
        "code": "DM4",
        "tier": 2,
        "kind": "pact",
        "cost": 100.0,
        "costText": "100 Demon Coins",
        "currency": "demon",
        "effects": [
          "Unlocks more Demon upgrades."
        ],
        "formulas": []
      },
      {
        "id": "demon-5",
        "sourceName": "Lava Pits",
        "code": "DM5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 500000000000.0,
        "costText": "500 B (5e11)",
        "currency": "coins",
        "effects": [
          "Increase the base production of Evil Fortresses by +200,000 and Hell Portals by +2,000,000.",
          "Your playtime in this game counts more by 6 additional hours."
        ],
        "formulas": []
      },
      {
        "id": "demon-6",
        "sourceName": "Demon Overseers",
        "code": "DM6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5000000000000.0,
        "costText": "5 T (5e12)",
        "currency": "coins",
        "effects": [
          "Increase the production of the three highest building tiers based on the amount of Trophies you unlocked."
        ],
        "formulas": [
          "(2 * x ^ 0.8)%, where x is the amount of trophies unlocked."
        ]
      },
      {
        "id": "demon-7",
        "sourceName": "Demonic Presence",
        "code": "DM7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 50000000000000.0,
        "costText": "50 T (5e13)",
        "currency": "coins",
        "effects": [
          "Increase the maximum Mana additively based on Evil spells cast in this game (additive)."
        ],
        "formulas": [
          "+(6 * x ^ 0.4), where x is Evil spells cast this game."
        ]
      },
      {
        "id": "demon-8",
        "sourceName": "Demons Alliance",
        "code": "DM8",
        "tier": 3,
        "kind": "alliance",
        "cost": 500.0,
        "costText": "500 Demons Coins",
        "currency": "demons",
        "effects": [
          "Unlocks more Demon upgrades."
        ],
        "formulas": []
      },
      {
        "id": "demon-9",
        "sourceName": "Infernal Magic",
        "code": "DM9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000000000000000.0,
        "costText": "5 Qa (5e15)",
        "currency": "coins",
        "effects": [
          "Hell Portals also increase your Mana Regeneration rate."
        ],
        "formulas": [
          "+(3.5 * x ^ 0.35), where x is the amount of Hell Portals you own."
        ]
      },
      {
        "id": "demon-10",
        "sourceName": "Burning Legion",
        "code": "DM10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+16,
        "costText": "50 Qa (5e16)",
        "currency": "coins",
        "effects": [
          "You gain assistants based on the amount of Hell Portals you own."
        ],
        "formulas": [
          "+(1.5 * x ^ 0.65), where x is the number of Hell Portals you own."
        ]
      },
      {
        "id": "demon-11",
        "sourceName": "Very Bad Guys",
        "code": "DM11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+17,
        "costText": "500 Qa (5e17)",
        "currency": "coins",
        "effects": [
          "Increase the production of Heaven's Gate / Hell Portals / Ancient Pyramid (based on your Alignment) based on the highest amount of Hell Portals you built in this Reincarnation."
        ],
        "formulas": [
          "(4 * x ^ 0.8)%, where x is the highest amount of Hell Portals you built in this Reincarnation."
        ]
      },
      {
        "id": "demon-12",
        "sourceName": ": Demon Champion Trophy",
        "code": "DM12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5000.0,
        "costText": "5000 Demon Coins",
        "currency": "demon",
        "effects": [
          "Increase the production of all buildings by 0.3% per Hall of Legends you own."
        ],
        "formulas": []
      }
    ]
  },
  {
    "id": "titan",
    "sourceName": "Titan",
    "name": "架构部",
    "alignment": "neutral",
    "spell": "lightningStrike",
    "spellName": "定点扩容",
    "upgrades": [
      {
        "id": "titan-0",
        "sourceName": "Titans Trade Treaty",
        "code": "TT0",
        "tier": 1,
        "kind": "treaty",
        "cost": 250.0,
        "costText": "250 Angel Coins + 250 Goblin Coins",
        "currency": "angel",
        "effects": [
          "Unlocks Tier 1 Titan upgrades."
        ],
        "formulas": []
      },
      {
        "id": "titan-1",
        "sourceName": "Colossal Forge",
        "code": "TT1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+20,
        "costText": "500 Qi (5e20)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of buildings you own."
        ],
        "formulas": [
          "(6 * x ^ 0.6)%, where x is the amount of buildings built."
        ]
      },
      {
        "id": "titan-2",
        "sourceName": "Charged Clicks",
        "code": "TT2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+21,
        "costText": "5 Sx (5e21)",
        "currency": "coins",
        "effects": [
          "Multiplicatively increase Mana Regeneration based on clicks made in this game."
        ],
        "formulas": [
          "(25 + 2.5 * log10(1 + x) ^ 2.5 + x ^ 0.25)%, where x is clicks made this game."
        ]
      },
      {
        "id": "titan-3",
        "sourceName": "Titan Obelisk",
        "code": "TT3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+22,
        "costText": "50 Sx (5e22)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance additively based on time spent as Neutral in this Reincarnation."
        ],
        "formulas": [
          "+(3 * x ^ 0.7)%, where x is time spent as Neutral in this Reincarnation."
        ]
      },
      {
        "id": "titan-4",
        "sourceName": "Titans Friendship Pact",
        "code": "TT4",
        "tier": 2,
        "kind": "pact",
        "cost": 2500.0,
        "costText": "2,500 Angel Coins + 2,500 Goblin Coins",
        "currency": "angel",
        "effects": [
          "Unlocks Tier 2 Titan Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "titan-5",
        "sourceName": "Titan Drill",
        "code": "TT5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+24,
        "costText": "5 Sp (5e24)",
        "currency": "coins",
        "effects": [
          "Increase the base production of Warrior Barracks / Slave Pens / Deep Mines by +9635, and Cathedrals / Dark Temples / Monasteries by +98000 (based on your Alignment). Also increase production of those building tiers by 1000%."
        ],
        "formulas": []
      },
      {
        "id": "titan-6",
        "sourceName": "Charged Structures",
        "code": "TT6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+25,
        "costText": "50 Sp (5e25)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of active spells."
        ],
        "formulas": [
          "(15 * x)%, where x is the amount of active spells."
        ]
      },
      {
        "id": "titan-7",
        "sourceName": "Titan Sized Walls",
        "code": "TT7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+26,
        "costText": "500 Sp (5e26)",
        "currency": "coins",
        "effects": [
          "Increase Hall of Legends production based on the amount of assistants you own."
        ],
        "formulas": [
          "(20 + 2.15 * ln(1 + x) ^ 2.15)%, where x is the amount of assistants you own."
        ]
      },
      {
        "id": "titan-8",
        "sourceName": "Titans Alliance",
        "code": "TT8",
        "tier": 3,
        "kind": "alliance",
        "cost": 10000.0,
        "costText": "10,000 Angel Coins + 10,000 Goblin Coins",
        "currency": "angel",
        "effects": [
          "Unlocks Tier 3 Titan Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "titan-9",
        "sourceName": "Cyclopean Strength",
        "code": "TT9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+28,
        "costText": "50 Oc (5e28)",
        "currency": "coins",
        "effects": [
          "Assistants count 200% more, and increase their production by 200%."
        ],
        "formulas": []
      },
      {
        "id": "titan-10",
        "sourceName": "Heavy Coins",
        "code": "TT10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+29,
        "costText": "500 Oc (5e29)",
        "currency": "coins",
        "effects": [
          "Increases Royal Exchanges production bonus by an additional 100% each, and reduces Royal Exchange cost multiplier by 0.01; with no other reductions applying, the multiplier will be 1.09 instead of 1.1."
        ],
        "formulas": []
      },
      {
        "id": "titan-11",
        "sourceName": "Oversized Legends",
        "code": "TT11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+30,
        "costText": "5 No (5e30)",
        "currency": "coins",
        "effects": [
          "Reduce Hall of Legends building cost multiplier by 0.01; with no other reductions applying, the multiplier will be 1.14 instead of 1.15.",
          "Also increase the production of assistants based on the amount of Halls of Legends built."
        ],
        "formulas": [
          "(6 * x ^ 0.6)%, where x is the amount of Hall of Legends built."
        ]
      },
      {
        "id": "titan-12",
        "sourceName": ": Titan Champion Trophy",
        "code": "TT12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 25000.0,
        "costText": "25,000 Angel Coins, 25,000 Goblin Coins",
        "currency": "angel",
        "effects": [
          "Increase Royal Exchanges production bonus by an additional 15% each."
        ],
        "formulas": []
      }
    ]
  },
  {
    "id": "druid",
    "sourceName": "Druid",
    "name": "流程部",
    "alignment": "neutral",
    "spell": "grandBalance",
    "spellName": "流程均衡",
    "upgrades": [
      {
        "id": "druid-0",
        "sourceName": "Druids Trade Treaty",
        "code": "DD0",
        "tier": 1,
        "kind": "treaty",
        "cost": 250.0,
        "costText": "250 Elven Coins + 250 Demon Coins",
        "currency": "elven",
        "effects": [
          "Unlocks Tier 1 Druid upgrades."
        ],
        "formulas": []
      },
      {
        "id": "druid-1",
        "sourceName": "Druidic Vocabulary",
        "code": "DD1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+20,
        "costText": "500 Qi (5e20)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on their tier, giving the best bonus to the lowest."
        ],
        "formulas": [
          "(4000 * (12 - T))%, where T is building tier."
        ]
      },
      {
        "id": "druid-2",
        "sourceName": "Animal Companions",
        "code": "DD2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+21,
        "costText": "5 Sx (5e21)",
        "currency": "coins",
        "effects": [
          "You instantly attract 3 Animal assistants and more will come based on the time spent in this game."
        ],
        "formulas": [
          "+(3 + 1.75 * x ^ 0.5), where x is time spent in this game."
        ]
      },
      {
        "id": "druid-3",
        "sourceName": "Natural Recycling",
        "code": "DD3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+22,
        "costText": "50 Sx (5e22)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance additively and multiplicatively based on the amount of the total buildings you own."
        ],
        "formulas": [
          "(0.4 x ^ 0.4)%, where x is total buildings built. (additively and multiplicatively)"
        ]
      },
      {
        "id": "druid-4",
        "sourceName": "Druids Friendship Pact",
        "code": "DD4",
        "tier": 2,
        "kind": "pact",
        "cost": 2500.0,
        "costText": "2,500 Elven Coins + 2,500 Demon Coins",
        "currency": "elven",
        "effects": [
          "Unlocks Tier 2 Druid Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "druid-5",
        "sourceName": "Earthly Bond",
        "code": "DD5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+24,
        "costText": "5 Sp (5e24)",
        "currency": "coins",
        "effects": [
          "Increase maximum Mana additively based on the highest amount of Stone Pillars built in this Reincarnation."
        ],
        "formulas": [
          "+(2 * x), where x is the highest amount of Stone Pillars built in this Reincarnation."
        ]
      },
      {
        "id": "druid-6",
        "sourceName": "Bardic Knowledge",
        "code": "DD6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+25,
        "costText": "50 Sp (5e25)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on your Maximum Mana."
        ],
        "formulas": [
          "(16 * ln(1 + x) ^ 2)%, where x is your Maximum Mana."
        ]
      },
      {
        "id": "druid-7",
        "sourceName": "Shapeshifting",
        "code": "DD7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+26,
        "costText": "500 Sp (5e26)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration additively based on the amount of assistants you own."
        ],
        "formulas": [
          "+(1.3 * x ^ 0.7), where x is the amount of assistants you own."
        ]
      },
      {
        "id": "druid-8",
        "sourceName": "Druids Alliance",
        "code": "DD8",
        "tier": 3,
        "kind": "alliance",
        "cost": 10000.0,
        "costText": "10,000 Elven Coins + 10,000 Demon Coins",
        "currency": "elven",
        "effects": [
          "Unlocks Tier 3 Druid upgrades."
        ],
        "formulas": []
      },
      {
        "id": "druid-9",
        "sourceName": "Mabinogion",
        "code": "DD9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+28,
        "costText": "50 Oc (5e28)",
        "currency": "coins",
        "effects": [
          "Increase the production of Non-Unique buildings based on their tier, giving the best bonus to the lowest."
        ],
        "formulas": [
          "(12 * 1.8 ^ (12 - T))%, where T is building tier."
        ]
      },
      {
        "id": "druid-10",
        "sourceName": "Earthly Soul",
        "code": "DD10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+29,
        "costText": "500 Oc (5e29)",
        "currency": "coins",
        "effects": [
          "Increase Mana Regeneration additively based on the highest amount of Stone Pillars you built in this Reincarnation."
        ],
        "formulas": [
          "+(x ^ 0.25), where x is the highest amount of Stone Pillars you built in this Reincarnation."
        ]
      },
      {
        "id": "druid-11",
        "sourceName": "Building Jungle",
        "code": "DD11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+30,
        "costText": "5 No (5e30)",
        "currency": "coins",
        "effects": [
          "Increase the production of each building based on the amount of buildings of the same type."
        ],
        "formulas": [
          "(1.5 * x ^ 0.9)%, where x is the amount of buildings of the same tier."
        ]
      },
      {
        "id": "druid-12",
        "sourceName": ": Druid Champion Trophy",
        "code": "DD12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 25000.0,
        "costText": "25,000 Elven Coins, 25,000 Demon Coins",
        "currency": "elven",
        "effects": [
          "Increase maximum Mana by 1 every 15 buildings you own."
        ],
        "formulas": []
      }
    ]
  },
  {
    "id": "faceless",
    "sourceName": "Faceless",
    "name": "创新部",
    "alignment": "neutral",
    "spell": "brainwave",
    "spellName": "灵感累积",
    "upgrades": [
      {
        "id": "faceless-0",
        "sourceName": "Faceless Trade Treaty",
        "code": "FC0",
        "tier": 1,
        "kind": "treaty",
        "cost": 250.0,
        "costText": "250 Fairy Coins + 250 Undead Coins",
        "currency": "fairy",
        "effects": [
          "Unlocks Tier 1 Faceless Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "faceless-1",
        "sourceName": "Territorial Expanse",
        "code": "FC1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+20,
        "costText": "500 Qi (5e20)",
        "currency": "coins",
        "effects": [
          "Increase the production of Citadels / Necropolises / Labyrinths (based on your Alignment) based on the amount of assistants you own."
        ],
        "formulas": [
          "(50 * ln(1 + x) ^ 2.5)%, where x is the amount of assistants you own."
        ]
      },
      {
        "id": "faceless-2",
        "sourceName": "Evolutive Mutation",
        "code": "FC2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+21,
        "costText": "5 Sx (5e21)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance based on the highest amount of Labyrinths you built in this Reincarnation."
        ],
        "formulas": [
          "+floor(3 * x ^ 0.6)%, where x is the highest amount of Labyrinths you built in this Reincarnation."
        ]
      },
      {
        "id": "faceless-3",
        "sourceName": "Deep Memory",
        "code": "FC3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+22,
        "costText": "50 Sx (5e22)",
        "currency": "coins",
        "effects": [
          "Multiplicatively increase assistants based on the time spent on your longest game session in this Reincarnation."
        ],
        "formulas": [
          "(0.3 * x ^ 0.7)%, where x is your Playtime (Longest Session) stat this Reincarnation."
        ]
      },
      {
        "id": "faceless-4",
        "sourceName": "Faceless Friendship Pact",
        "code": "FC4",
        "tier": 2,
        "kind": "pact",
        "cost": 2500.0,
        "costText": "2,500 Fairy Coins + 2,500 Undead Coins",
        "currency": "fairy",
        "effects": [
          "Unlocks Tier 2 Faceless Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "faceless-5",
        "sourceName": "Gold Synthesis",
        "code": "FC5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+24,
        "costText": "5 Sp (5e24)",
        "currency": "coins",
        "effects": [
          "Increase the production of Neutral buildings based on the amount of coins owned."
        ],
        "formulas": [
          "(0.2 * ln(1 + x) ^ 2)%, where x is the amount of coins owned."
        ]
      },
      {
        "id": "faceless-6",
        "sourceName": "Mitosis",
        "code": "FC6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+25,
        "costText": "50 Sp (5e25)",
        "currency": "coins",
        "effects": [
          "Gain additional Faceless Assistants based on the amount of buildings you own."
        ],
        "formulas": [
          "+floor(0.5 * x ^ 0.5), where x is the amount of buildings you own."
        ]
      },
      {
        "id": "faceless-7",
        "sourceName": "Overgrowth",
        "code": "FC7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+26,
        "costText": "500 Sp (5e26)",
        "currency": "coins",
        "effects": [
          "Increases production based on the highest amount of buildings purchased in a single game in this Reincarnation."
        ],
        "formulas": [
          "(0.8 * x ^ 0.8)%, where x is the highest amount of buildings purchased in a single game in this Reincarnation."
        ]
      },
      {
        "id": "faceless-8",
        "sourceName": "Faceless Alliance",
        "code": "FC8",
        "tier": 3,
        "kind": "alliance",
        "cost": 10000.0,
        "costText": "10,000 Fairy Coins + 10,000 Undead Coins",
        "currency": "fairy",
        "effects": [
          "Unlocks Tier 3 Faceless Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "faceless-9",
        "sourceName": "Magical Treasure",
        "code": "FC9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+28,
        "costText": "50 Oc (5e28)",
        "currency": "coins",
        "effects": [
          "Increase mana regeneration based on the amount of assistants you own."
        ],
        "formulas": [
          "+(2.5 * x ^ 0.5), where x is the amount of assistants you own."
        ]
      },
      {
        "id": "faceless-10",
        "sourceName": "Abominations",
        "code": "FC10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+29,
        "costText": "500 Oc (5e29)",
        "currency": "coins",
        "effects": [
          "Increase the production of assistants based on the amount of active spells."
        ],
        "formulas": [
          "(20 * x ^ 0.9)%, where x is the amount of active spells."
        ]
      },
      {
        "id": "faceless-11",
        "sourceName": "Hive Mind",
        "code": "FC11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+30,
        "costText": "5 No (5e30)",
        "currency": "coins",
        "effects": [
          "Increases production based on total time spent affiliated with Faceless. Persists through Reincarnations."
        ],
        "formulas": [
          "(x ^ 0.5)%, where x is time spent as Faceless (All Time)."
        ]
      },
      {
        "id": "faceless-12",
        "sourceName": ": Faceless Champion Trophy",
        "code": "FC12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 25000.0,
        "costText": "25,000 Fairy Coins, 25,000 Undead Coins",
        "currency": "fairy",
        "effects": [
          "Your production is increased based on the highest amount of buildings purchased in a single game."
        ],
        "formulas": [
          "(0.25 * x ^ 0.75)%, where x is your Buildings Owned (Max) stat."
        ]
      }
    ]
  },
  {
    "id": "dwarf",
    "sourceName": "Dwarf",
    "name": "工程委员会",
    "alignment": "good",
    "spell": "diamondPickaxe",
    "spellName": "工程审计",
    "upgrades": [
      {
        "id": "dwarf-0",
        "sourceName": "Dwarven Trade Treaty",
        "code": "DN0",
        "tier": 1,
        "kind": "treaty",
        "cost": 3000.0,
        "costText": "3,000 Dwarven Coins",
        "currency": "dwarven",
        "effects": [
          "Unlocks Tier 1 Upgrades"
        ],
        "formulas": []
      },
      {
        "id": "dwarf-1",
        "sourceName": "Dwarven Ale",
        "code": "DN1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+45,
        "costText": "5 Qad (5e45)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance based on the amount of Blacksmiths you own (Additive)."
        ],
        "formulas": [
          "+(2 * x ^ 0.5)%, where x is the amount of Blacksmiths you own."
        ]
      },
      {
        "id": "dwarf-2",
        "sourceName": "Expert Masonry",
        "code": "DN2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+46,
        "costText": "50 Qad (5e46)",
        "currency": "coins",
        "effects": [
          "Reduce all building cost multipliers.",
          "Reduces cost multiplier by 0.01; with no other reductions applying, the multiplier will be 1.14 instead of 1.15."
        ],
        "formulas": []
      },
      {
        "id": "dwarf-3",
        "sourceName": "Mining Prodigies",
        "code": "DN3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+47,
        "costText": "500 Qad (5e47)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of Excavations you made, including resets, in this Reincarnation."
        ],
        "formulas": [
          "(40 * (x * (1 + 2 * y)) ^ 0.4)%, where x is the number of excavations made this Reincarnation, y is the number of excavation resets in this Reincarnation."
        ]
      },
      {
        "id": "dwarf-4",
        "sourceName": "Dwarven Friendship Pact",
        "code": "DN4",
        "tier": 2,
        "kind": "pact",
        "cost": 12000.0,
        "costText": "12,000 Dwarven Coins",
        "currency": "dwarven",
        "effects": [
          "Unlocks more Dwarven Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "dwarf-5",
        "sourceName": "Underground Citadels",
        "code": "DN5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+49,
        "costText": "50 Qid (5e49)",
        "currency": "coins",
        "effects": [
          "Multiplicatively increase Mana Regeneration based on the amount of Gems you own."
        ],
        "formulas": [
          "(1.5 * log10(1 + x) ^ 1.5)%, where x is the amount of Gems you own."
        ]
      },
      {
        "id": "dwarf-6",
        "sourceName": "Indestructible Treasure",
        "code": "DN6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+50,
        "costText": "500 Qid (5e50)",
        "currency": "coins",
        "effects": [
          "Increase clicking reward based on the amount of buildings you own."
        ],
        "formulas": [
          "(0.5 * x ^ 0.65)%, where x is the amount of buildings you own."
        ]
      },
      {
        "id": "dwarf-7",
        "sourceName": "Bearded Assistants",
        "code": "DN7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+51,
        "costText": "5 Sxd (5e51)",
        "currency": "coins",
        "effects": [
          "Increase the production of assistants based on how long their beard is (it grows over time!)."
        ],
        "formulas": [
          "(x ^ 0.7)%, where x is time spent in this game."
        ]
      },
      {
        "id": "dwarf-8",
        "sourceName": "Dwarven Alliance",
        "code": "DN8",
        "tier": 3,
        "kind": "alliance",
        "cost": 30000.0,
        "costText": "30,000 Dwarven Coins",
        "currency": "dwarven",
        "effects": [
          "Unlocks more Dwarven Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "dwarf-9",
        "sourceName": "Battlehammers",
        "code": "DN9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+53,
        "costText": "500 Sxd (5e53)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the amount of Dwarven Coins found in this game."
        ],
        "formulas": [
          "(2 * ln(1 + x) ^ 2))%, where x is the amount of Dwarven Coins found in this game."
        ]
      },
      {
        "id": "dwarf-10",
        "sourceName": "Magic Resistance",
        "code": "DN10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+54,
        "costText": "5 Spd (5e54)",
        "currency": "coins",
        "effects": [
          "Reduce Excavation cost multiplier."
        ],
        "formulas": [
          "Reduces cost multiplier by 0.02; with no other reductions applying, the multiplier will be 1.18 instead of 1.2"
        ]
      },
      {
        "id": "dwarf-11",
        "sourceName": "Overwatch",
        "code": "DN11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+55,
        "costText": "50 Spd (5e55)",
        "currency": "coins",
        "effects": [
          "Increase Maximum Mana based on the duration of your longest spell."
        ],
        "formulas": [
          "+(50 + 35 * x ^ 0.7), where x is the duration of your longest spell."
        ]
      },
      {
        "id": "dwarf-12",
        "sourceName": ": Dwarven Champion Trophy",
        "code": "DN12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 75000.0,
        "costText": "75,000 Dwarven Coins",
        "currency": "dwarven",
        "effects": [
          "Increase the production of all buildings based on the total amount of Excavations you made."
        ],
        "formulas": [
          "(2 * x ^ 0.9)%, where x is the number of excavations you made."
        ]
      }
    ]
  },
  {
    "id": "drow",
    "sourceName": "Drow",
    "name": "影子项目组",
    "alignment": "evil",
    "spell": "comboStrike",
    "spellName": "影子连击",
    "upgrades": [
      {
        "id": "drow-0",
        "sourceName": "Drow Trade Treaty",
        "code": "DW0",
        "tier": 1,
        "kind": "treaty",
        "cost": 3000.0,
        "costText": "3000 Drow Coins",
        "currency": "drow",
        "effects": [
          "Unlocks Drow Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "drow-1",
        "sourceName": "Underworld Tyranny",
        "code": "DW1",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+45,
        "costText": "5 Qad (5e45)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on your total time spent being Evil in this Reincarnation."
        ],
        "formulas": [
          "(0.7 * x ^ 0.7)%, where x is time spent being Evil in this Reincarnation."
        ]
      },
      {
        "id": "drow-2",
        "sourceName": "Honor Among Killers",
        "code": "DW2",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+46,
        "costText": "50 Qad (5e46)",
        "currency": "coins",
        "effects": [
          "Increase Faction Coin find chance based on the amount of assistants you own.(Additive)"
        ],
        "formulas": [
          "+(100 + 0.5 * x ^ 0.5)%, where x is the amount of assistants you own."
        ]
      },
      {
        "id": "drow-3",
        "sourceName": "Shadow Advance",
        "code": "DW3",
        "tier": 1,
        "kind": "upgrade",
        "cost": 5e+47,
        "costText": "500 Qad (5e47)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on Maximum Mana."
        ],
        "formulas": [
          "(2 * log10(1 + x) ^ 2))%, where x is your Maximum Mana."
        ]
      },
      {
        "id": "drow-4",
        "sourceName": "Drow Friendship Pact",
        "code": "DW4",
        "tier": 2,
        "kind": "pact",
        "cost": 12000.0,
        "costText": "12,000 Drow Coins",
        "currency": "drow",
        "effects": [
          "Unlocks more Drow Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "drow-5",
        "sourceName": "Mana Addicts",
        "code": "DW5",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+49,
        "costText": "50 Qid (5e49)",
        "currency": "coins",
        "effects": [
          "Mana Regeneration increases over time."
        ],
        "formulas": [
          "+(2.5 + 0.25 * x ^ 0.5), where x is time spent in this game."
        ]
      },
      {
        "id": "drow-6",
        "sourceName": "Blood Sacrifices",
        "code": "DW6",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+50,
        "costText": "500 Qid (5e50)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on the highest amount of Dark Temples you built in this Reincarnation."
        ],
        "formulas": [
          "(3 * x)%, where x is the highest amount of Dark Temples you built in this Reincarnation."
        ]
      },
      {
        "id": "drow-7",
        "sourceName": "Blackmail",
        "code": "DW7",
        "tier": 2,
        "kind": "upgrade",
        "cost": 5e+51,
        "costText": "5 Sxd (5e51)",
        "currency": "coins",
        "effects": [
          "Reduce the cost multiplier for Royal Exchanges."
        ],
        "formulas": [
          "Reduces Royal Exchange cost multiplier by 0.02; with no other reductions applying, the multiplier will be 1.08 instead of 1.1"
        ]
      },
      {
        "id": "drow-8",
        "sourceName": "Drow Alliance",
        "code": "DW8",
        "tier": 3,
        "kind": "alliance",
        "cost": 30000.0,
        "costText": "30,000 Drow Coins",
        "currency": "drow",
        "effects": [
          "Unlocks more Drow Upgrades."
        ],
        "formulas": []
      },
      {
        "id": "drow-9",
        "sourceName": "Spider Gods",
        "code": "DW9",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+53,
        "costText": "500 Sxd (5e53)",
        "currency": "coins",
        "effects": [
          "Mutiplicatively increase assistants based on the amount of buildings you own."
        ],
        "formulas": [
          "(0.5 * x ^ 0.5)%, where x is the amount of buildings you own."
        ]
      },
      {
        "id": "drow-10",
        "sourceName": "Professional Assassins",
        "code": "DW10",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+54,
        "costText": "5 Spd (5e54)",
        "currency": "coins",
        "effects": [
          "Multiplicatively increase production bonus from Gems based on the amount of Royal Exchanges you made."
        ],
        "formulas": [
          "(0.6 * x ^ 0.6)%, where x is Royal Exchanges made."
        ]
      },
      {
        "id": "drow-11",
        "sourceName": "Blade Dance",
        "code": "DW11",
        "tier": 3,
        "kind": "upgrade",
        "cost": 5e+55,
        "costText": "50 Spd (5e55)",
        "currency": "coins",
        "effects": [
          "Increase the production of all buildings based on Combo Strike counter in this game."
        ],
        "formulas": [
          "(100 + 80 * x ^ 0.4)%, where x is your Combo Strike counter."
        ]
      },
      {
        "id": "drow-12",
        "sourceName": ": Drow Champion Trophy",
        "code": "DW12",
        "tier": 3,
        "kind": "upgrade",
        "cost": 75000.0,
        "costText": "75,000 Drow Coins",
        "currency": "drow",
        "effects": [
          "Increase the production of assistants based on the amount of royal exchanges you purchased in this game."
        ],
        "formulas": [
          "(2 * x ^ 0.8)%, where x is your Royal Exchanges Made stat."
        ]
      }
    ]
  }
];
