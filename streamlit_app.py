import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
import ast


st.title("Interactive Tag Analysis for NEU Colleges")

# Upload CSV file
uploaded_file = st.file_uploader("Upload your CSV file", type="csv")
if uploaded_file:
    # Load your data
    data = pd.read_csv(uploaded_file)

    # Parse Popular Tags and ensure it's a list
    data['Popular Tags'] = data['Popular Tags'].apply(ast.literal_eval)

    # Explode Popular Tags for detailed analysis
    exploded_tags = data.explode('Popular Tags')[['Popular Tags', 'Department', 'NEU_Colleges', 'Average Rating (Out of 5)', 'Reviews']]

    # Aggregate tag frequencies
    tag_counts = exploded_tags.groupby(['Popular Tags', 'NEU_Colleges', 'Department']).size().reset_index(name='Count')

    # Dropdown filter for colleges
    colleges = tag_counts['NEU_Colleges'].unique()
    selected_college = st.selectbox("Select College:", options=colleges)

    # Filter data based on selected college
    filtered_tag_counts = tag_counts[tag_counts['NEU_Colleges'] == selected_college]

    # Create a bar chart for Popular Tags with color based on Colleges
    tag_chart = alt.Chart(filtered_tag_counts).mark_bar().encode(
        x=alt.X('Count:Q', title='Tag Frequency'),
        y=alt.Y('Popular Tags:N', sort='-x', title='Popular Tags'),
        color=alt.Color('Department:N', legend=alt.Legend(title="Department")),
        tooltip=['Popular Tags', 'Count', 'NEU_Colleges', 'Department']
    ).properties(
        width=800,
        height=500,
        title=f'Tag Frequency for {selected_college}'
    )

    # Truncate long comments for display
    exploded_tags['Comments'] = exploded_tags['Reviews'].apply(lambda r: str(r)[:100])

    # Filter exploded_tags based on selected college
    filtered_exploded_tags = exploded_tags[exploded_tags['NEU_Colleges'] == selected_college]

    # Add comments chart
    comments_chart = alt.Chart(filtered_exploded_tags).mark_text().encode(
        text='Comments:N',
        tooltip=['Popular Tags', 'Department', 'Average Rating (Out of 5)', 'Comments']
    ).properties(
        width=800,
        height=150,
        title=f'Comments for {selected_college}'
    )

    # Display the charts in Streamlit
    st.altair_chart(tag_chart, use_container_width=True)
    st.altair_chart(comments_chart, use_container_width=True)
else:
    st.write("Please upload a CSV file to get started.")