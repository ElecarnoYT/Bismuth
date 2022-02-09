function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
       if (arr[i] === value) {
          arr.splice(i, 1);
       } else {
          ++i;
       }
    }
    return arr;
}

Inventory = function(items, socket, server){
    var self = {
        items:items, //{id:"itemId",amount:1}
        recipes:[],
        workbenches:[],
        socket:socket,
        server:server,
    }
    self.addItem = function(id, amount){
        for(var i = 0; i < self.items.length; i++){
            if(self.items[i].id === id){
                self.items[i].amount += amount
                self.refreshRender()
                return
            }
        }
        self.items.push({id:id,amount:amount})
        self.refreshRender()
    }
    self.removeItem = function(id, amount){
        for(var i = 0; i < self.items.length; i++){
            if(self.items[i].id === id){
                self.items[i].amount -= amount
                if(self.items[i].amount <= 0)
                    self.items.splice(i,1)
                self.refreshRender()
                return
            }
        }
    }
    self.hasItem = function(id, amount){
        for(var i = 0; i < self.items.length; i++){
            if(self.items[i].id === id){
                return self.items[i].amount >= amount
            }
        }
        return false
    }
    self.getItemSpriteId = function(id){
        for(var i = 0; i < self.items.length; i++){
            if(self.items[i].id === id){
                //console.log(spriteIds[self.items[i].id])
                return spriteIds[self.items[i].id]
            }
        }
    }
    self.refreshRender = function(){
        // server
        if(self.server){
            self.socket.emit("updateInventory", {
                items:self.items,
                recipes:self.recipes,
                workbenches:self.workbenches,
            })
            return
        }   

        // client only
        var inventory = document.getElementById("inventory")
        inventory.innerHTML = ""
        var addInventoryButton = function(data){
            let item = Item.list[data.id]
            let button = document.createElement('button')
            button.onclick = function(){
                self.socket.emit("useItem", item.id)
            }
            button.innerText = item.name + " x" + data.amount
            inventory.appendChild(button)
        }
        
        for(var i = 0; i < self.items.length; i++)
            addInventoryButton(self.items[i])

        var crafting = document.getElementById("crafting")
        crafting.innerHTML = ""
        var addCraftingButton = function(data){
            console.log(data)
            let button = document.createElement('button')
            button.onclick = function(){
                self.socket.emit("craft", data)
            }
            button.innerText = data + " (" + Recipe.list[data].requiredItems + ")"
            crafting.appendChild(button)
        }

        for(var i = 0; i < self.recipes.length; i++)
            addCraftingButton(self.recipes[i])

        var work = document.getElementById("workbench")
        work.innerHTML = ""
        var addWorkButton = function(data){
            console.log(data)
            let button = document.createElement('button')
            button.onclick = function(){
                self.socket.emit("craft", data)
            }
            button.innerText = data + " (" + Recipe.list[data].requiredItems + ")"
            work.appendChild(button)
        }

        for(var i = 0; i < self.workbenches.length; i++)
            addWorkButton(self.workbenches[i])
    }
    self.addRecipes = function(sentRecipes){
        self.recipes = []
        for(var i = 0; i < sentRecipes.length; i++){
            self.recipes.push(sentRecipes[i])
        }
        self.refreshRender()
    }
    self.addWorkbenchRecipes = function(sentWorks){
        self.workbenches = []
        for(var i = 0; i < sentWorks.length; i++){
            self.workbenches.push(sentWorks[i])
        }
        self.refreshRender()
    }

    // server
    if(self.server){
        self.socket.on("useItem", function(itemId){
            if(!self.hasItem(itemId, 1)){
                console.log("someone tryna cheat possibly")
                return
            }
            let item = Item.list[itemId]
            item.event(Player.list[self.socket.id])
        })

        self.socket.on("craft", function(data){
            self.addItem(data, 1)

            let recipe = Recipe.list[data]
            for(var i = 0; i < recipe.requiredItems.length; i++)   
                self.removeItem(recipe.requiredItems[i], 1)
        })
    }

    return self
}

// ---------------------------------------------------------------------------

Item = function(id, name, event){
    var self = {
        id:id,
        name:name,
        event:event,
    }
    Item.list[self.id] = self
    return self
}
Item.list = {}

Item("medkit","Medkit", function(player){
    if(player.hp <= 90)
        player.hp += 10
    else
        player.hp = 100
    player.inventory.removeItem("medkit", 1)
    player.inventory.addItem("adrenaline", 1)
})

Item("adrenaline","Adrenaline", function(player){
    for(var i = 0; i < player.effects.length; i++)
        if(player.effects[i] === "Adrenaline")
            return
    
    player.hp -= 50
    player.maxSpeed *= 2
    player.effects.push("Adrenaline")
    player.inventory.removeItem("adrenaline", 1)
    setTimeout(function(){
        player.maxSpeed /= 2
        removeItemAll(player.effects, "Adrenaline")
    }, 5000)
})

Item("almond_water","Almond Water", function(player){
    for(var i = 0; i < player.effects.length; i++)
        if(player.effects[i] === "Almonised")
            return

    player.hp *= 1.5
    if(player.hp > 100)
        player.hp = 100
    player.maxSpeed /= 2
    player.effects.push("Almonised")
    player.inventory.removeItem("almond_water", 1)
    setTimeout(function(){
        player.maxSpeed *= 2
        removeItemAll(player.effects, "Almonised")
    }, 5000)
})

Item("cave_beef","Cave Beef", function(player){
    player.inventory.removeItem("cave_beef", 1)
})

// materials
Item("floof_wool","Floof Wool", function(player){})
Item("fibres","Fibres", function(player){})
Item("iron_bar","Iron Bar", function(player){})
Item("aluminium_bar","Aluminium Bar", function(player){})
Item("steel_bar","Steel Bar", function(player){})
Item("blood_bag","Blood Bag", function(player){})
Item("reinforced_bone","Reinforced Bone", function(player){})
Item("albino_fur","Albino Fur", function(player){})
Item("iron_panel","Iron Panel", function(player){})
Item("bolts","Bolts", function(player){})
Item("weaponry_mould","Weaponry Mould", function(player){})
Item("industrial","Industrial Mould", function(player){})
Item("precision_blade","Precision Blade", function(player){})
Item("blade_kit","Blade Kit", function(player){})
Item("rifle_kit","Rifle Kit", function(player){})
Item("pistol_kit","Pistol Kit", function(player){})
Item("electrical_parts","Electrical Parts", function(player){})
Item("turbine","Turbine", function(player){})
Item("drill_bit","Drill Bit", function(player){})
Item("graphite","Graphite", function(player){})
Item("copper","Copper", function(player){})
Item("radium","radium", function(player){})

//consumables
Item("rock_tile_kit","Rock Tile Kit", function(player){
    player.inventory.removeItem("rock_tile_kit", 1)
    player.inventory.addItem("rock_tiles", 50)
})

// ammunition
Item("bronze_round","Bronze Round", function(player){})
Item("bronze_round_kit","Bronze Round Kit", function(player){
    player.inventory.removeItem("bronze_round_kit", 1)
    player.inventory.addItem("bronze_round", 15)
})
Item("iron_round","Iron Round", function(player){})
Item("iron_round_kit","Iron Round Kit", function(player){
    player.inventory.removeItem("iron_round_kit", 1)
    player.inventory.addItem("iron_round", 15)
})
Item("compound_round","Compound Round", function(player){})
Item("compound_round_kit","Compound Round Kit", function(player){
    player.inventory.removeItem("compound_round_kit", 1)
    player.inventory.addItem("compound_round", 20)
})

// ammunition
Item("bronze_round","Bronze Round", function(player){})
Item("bronze_round_kit","Bronze Round Kit", function(player){
    player.inventory.removeItem("bronze_round_kit", 1)
    player.inventory.addItem("bronze_round", 15)
})
Item("iron_round","Iron Round", function(player){})

// tools & placeables
let spriteIds = {
    // guns
    "shroom_k": [2, 0],
    "hunting_rifle": [2, 1],
    // harvest tools
    "survival_knife": [3, 0],
    "bronze_sickle": [3, 1],
    // mining tools
    "bronze_pickaxe": [4, 0],
    "iron_pickaxe": [4, 2],
    "iron_drill": [4, 3],
    // work tools
    "bronze_chisel": [5, 0],
    // tiles & placeables
    "rock": [1, 0],
    "rocky_floor": [1, 0],
    "granite": [1, 0],
    "earth": [1, 0],
    "organic_floor": [1, 0],
    "rocky_floor": [1, 0],
    "beq_rock": [1, 0],
    "dirt_floor": [1, 0],
}

itemToHotbar = function(player, item){
    let idx = player.hotbar.indexOf(item)
    player.hotbar[idx] = "Nothing"
    player.hotbar.splice(player.activeSlot, 1, item)
}

// tiles
Item("rock","Rock", function(player){itemToHotbar(player, "rock")})
Item("granite","Granite", function(player){itemToHotbar(player, "granite")})
Item("rocky_floor","Rocky Floor", function(player){itemToHotbar(player, "rocky_floor")})
Item("earth","Earth", function(player){itemToHotbar(player, "earth")})
Item("beq_rock","Beq Rock", function(player){itemToHotbar(player, "beq_rock")})
Item("organic_floor","Organic Floor", function(player){itemToHotbar(player, "organic_floor")})
Item("dirt_floor","Dirt Floor", function(player){itemToHotbar(player, "dirt_floor")})
Item("mound","Mound", function(player){itemToHotbar(player, "mound")})
Item("shroom_wood","Shroom Wood", function(player){itemToHotbar(player, "shroom_wood")})
Item("iron_ore","Iron Ore", function(player){itemToHotbar(player, "iron_ore")})
Item("rock_tiles","Rock Tiles", function(player){itemToHotbar(player, "rock_tiles")})

// workbenches
Item("old_workbench","Old Workbench", function(player){itemToHotbar(player, "old_workbench")})
Item("old_furnace","Old Furnace", function(player){itemToHotbar(player, "old_furnace")})
Item("metalworking_bench","Metalworking Bench", function(player){itemToHotbar(player, "metalworking_bench")})
Item("forge","Forge", function(player){itemToHotbar(player, "forge")})

// weapons
Item("shroom_k","Shroom-K Rifle", function(player){itemToHotbar(player, "shroom_k")})
Item("hunting_rifle","Hunting Rifle", function(player){itemToHotbar(player, "hunting_rifle")})

// harvest tools
Item("survival_knife","Survival Knife", function(player){itemToHotbar(player, "survival_knife")})
Item("bronze_sickle","Bronze Sickle", function(player){itemToHotbar(player, "bronze_sickle")})
Item("iron_sickle","Iron Sickle", function(player){itemToHotbar(player, "iron_sickle")})

// mining tools
Item("bronze_pickaxe","Bronze Pickaxe", function(player){itemToHotbar(player, "bronze_pickaxe")})
Item("iron_pickaxe","Iron Pickaxe", function(player){itemToHotbar(player, "iron_pickaxe")})
Item("iron_drill","Iron Drill", function(player){itemToHotbar(player, "iron_drill")})

// work tools
Item("bronze_chisel","Bronze Chisel", function(player){itemToHotbar(player, "bronze_chisel")})
Item("iron_chisel","Iron Chisel", function(player){itemToHotbar(player, "iron_chisel")})

// placeables
Item("stone","Stone", function(player){itemToHotbar(player, "stone")})
Item("cave_flower","Cave Flower", function(player){itemToHotbar(player, "cave_flower")})
Item("toad_shroom","Toad Shroom", function(player){itemToHotbar(player, "toad_shroom")})
Item("pollen_shroom","Pollen Shroom", function(player){itemToHotbar(player, "pollen_shroom")})
Item("bronze_berry","Bronze Berry", function(player){itemToHotbar(player, "bronze_berry")})
Item("oxygen_canister","Oxygen Canister", function(player){itemToHotbar(player, "oxygen_canister")})
Item("carbon_dioxide_canister","Carbon Dioxide Canister", function(player){itemToHotbar(player, "carbon_dioxide_canister")})
Item("blood_core","Blood Core", function(player){itemToHotbar(player, "blood_core")})

// ---------------------------------------------------------------------------

Recipe = function(resultItem, requiredItems){
    var self = {
        resultItem:resultItem,
        requiredItems:requiredItems,
    }
    Recipe.list[self.resultItem] = self
    return self
}
Recipe.list = {}

// non-workbench
Recipe("shroom_wood", ["toad_shroom", "stone"])
Recipe("fibres", ["pollen_shroom", "cave_flower"])
Recipe("bronze_pickaxe", ["bronze_berry", "fibres", "shroom_wood"])
Recipe("bronze_sickle", ["bronze_berry", "fibres", "shroom_wood"])
Recipe("bronze_chisel", ["bronze_berry", "fibres", "shroom_wood", "stone"])
Recipe("bronze_round_kit", ["bronze_berry", "stone"])
Recipe("iron_round_kit", ["iron_bar", "stone"])
Recipe("rock_tile_kit", ["rock", "stone"])

// old_workbench
Recipe("forge", ["iron_panel", "bolts", "fibres"])
Recipe("metalworking_bench", ["iron_bar", "stone"])

// old_furnace
Recipe("iron_bar", ["iron_ore"])
