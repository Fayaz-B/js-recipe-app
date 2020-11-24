import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';


/** Global State of the app
 * - Search object 
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes 
 *  */ 
const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    // 1) Get query from the view
    recipeView.clearRecipe();
    const query = searchView.getInput();
    
    if(query){
        // 2) New search object and add to state
        state.search = new Search(query);
        try{
            // 3) Prepare UI for results
            searchView.clearResults();
            searchView.clearInput();
            renderLoader(elements.searchRes);
            // 4) Search for the recipes with the function
            await state.search.getResults();

            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch(error){
            alert('Something is not right in the search..');
            clearLoader();
        }

    }

}

//All eventlistneres are in controller for delegation
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchRes.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    
    if(btn){
        const goTopage = parseInt(btn.dataset.goto,10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goTopage);
        
    }
    
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    if(id){
        //Create the recipe object
        state.recipe = new Recipe(id);
        //Prepare the UI for the results
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // Highlight the selected item
        if(state.search)
            searchView.highlightSelect(id);

        try{
            //Get the recipes data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calculate the servings and the time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render it to the UI
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
        }catch(error){
            console.log(error);
            alert('Soemthing is not right :(');
        }
        
    }

};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */

const controlList = () =>  {
    //Create a new list IF there is none yet

    if(!state.list) state.list = new List();
    
    // Add the ingredient to the list

    state.recipe.ingredients.forEach(el =>{
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//Handle delete  and update list items
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id);
        // Delete from UI
        listView.deleteItem(id);
                    
    }else if(e.target.matches('.shopping_count-value'))  {
            const val = parseFloat(e.target.value, 10);
            state.list.updateCount(id, val);
    }
});

/**
 * LIKES CONTROLLER
 */
state.likes = new Likes(); 

const controlLikes = () => {

    if (!state.likes) state.likes = new Likes(); 
    const currentID = state.recipe.id; 
    //Create a likes list if HAS NOT been created
    
    
    //User has not liked the current recipe
    if(!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add the like to UI list
        likesView.renderLike(newLike);
    //User HAS liked the current recipe 
    } else {
        // Remove the like from the state
        state.likes.deleteLike(currentID);
        // Toggle the like button
        likesView.toggleLikeBtn(false);
        // Remove from the UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    
};

// Restore liked recipe when page loads
window.addEventListener('load', () => {
    state.likes = new Likes();
    // Restore Links
    state.likes.readStorage();
    // Toggle like menu button 
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like)); 

});




//Handling the recipe button clicks

elements.recipe.addEventListener('click', e => {


        if (e.target.matches('btn-decrease, .btn-decrease *')) {
            // Decreased button is clicked
            if(state.recipe.servings > 1){
                state.recipe.updateServings('dec');
                recipeView.updateServingsIngredients(state.recipe);
            }
        
        } else if (e.target.matches('.btn-increase, .btn-increase *')){
            // Increase button is clicked
            state.recipe.updateServings('inc'); 
            recipeView.updateServingsIngredients(state.recipe);
        } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
            controlList();  
        } else if(e.target.matches('.recipe__love, .recipe__love *')){
            controlLikes    ();
        }
    
});


